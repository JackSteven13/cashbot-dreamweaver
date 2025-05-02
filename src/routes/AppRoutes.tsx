
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import Index from '../pages/Index';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import About from '../pages/About';
import NotFound from '../pages/NotFound';
import Offres from '../pages/Offres';
import Payment from '../pages/Payment';
import PaymentSuccess from '../pages/PaymentSuccess';
import Terms from '../pages/Terms';
import Contact from '../pages/Contact';
import AnalysisController from '../components/dashboard/analysis/AnalysisController';
import { hasValidConnection, checkDnsResolution } from '@/utils/auth';
import { NetworkStatusAlert } from '@/components/ui/alert-dns';
import { getNetworkStatus, showDnsTroubleshootingToast } from '@/utils/auth/networkUtils';

const AppRoutes: React.FC = () => {
  // État pour suivre les problèmes de réseau
  const [networkIssue, setNetworkIssue] = useState<{
    show: boolean;
    isOnline: boolean;
    dnsWorking: boolean;
  }>({
    show: false,
    isOnline: true,
    dnsWorking: true
  });
  
  // Force HTTPS in production with more specific conditions
  useEffect(() => {
    // HTTPS Enforcement - Critical Security Check
    const enforceHttps = () => {
      // Ensure we're on HTTPS and not on localhost
      if (
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' && 
        window.location.protocol === 'http:'
      ) {
        // Force redirect to HTTPS with cache-busting parameter
        window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}?secure=1&t=${Date.now()}`);
        return false;
      }
      return true;
    };
    
    // DNS Error detection and recovery - version améliorée
    const checkConnectivity = async () => {
      try {
        // Vérification plus robuste avec multiples domaines et gestion intelligente
        const status = await getNetworkStatus(true);
        
        // Mise à jour de l'état pour l'affichage des alertes
        setNetworkIssue({
          show: !status.isOnline || !status.dnsWorking,
          isOnline: status.isOnline,
          dnsWorking: status.dnsWorking
        });
        
        // Notification à l'utilisateur si problème détecté
        if (status.isOnline && !status.dnsWorking) {
          toast.warning("Problème de DNS détecté. Essayez de vider votre cache DNS.", {
            duration: 8000,
            action: {
              label: "Aide",
              onClick: () => {
                showDnsTroubleshootingToast();
              }
            }
          });
        } else if (!status.isOnline) {
          toast.error("Problème de connexion réseau. Vérifiez votre connexion internet.", {
            duration: 5000
          });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la connexion:", error);
      }
    };
    
    // First enforce HTTPS
    if (!enforceHttps()) return;
    
    // PRIORITÉ MAXIMALE: Redirect from streamgenius.fr to streamgenius.io
    if (
      window.location.hostname === 'streamgenius.fr' || 
      window.location.hostname === 'www.streamgenius.fr'
    ) {
      console.log("Redirection .fr vers .io activée");
      // Redirect from .fr to .io with cache busting parameter
      window.location.replace(`https://streamgenius.io${window.location.pathname}${window.location.search}?source=fr_redirect&t=${Date.now()}`);
      return; // Stop execution to ensure redirect happens immediately
    }
    
    // Add specific check for streamgenius.io domain
    if (
      window.location.hostname === 'www.streamgenius.io' &&
      window.location.protocol === 'https:'
    ) {
      // Redirect www to non-www
      window.location.replace(`https://streamgenius.io${window.location.pathname}${window.location.search}`);
    }
    
    // Check DNS and connectivity on load
    checkConnectivity();
    
    // Check periodically - moins souvent pour économiser les ressources
    const intervalId = setInterval(() => {
      enforceHttps();
      checkConnectivity();
    }, 60000); // Check toutes les minutes au lieu de 30 secondes
    
    // Force dark mode class on document for consistent appearance
    document.documentElement.classList.add('dark');
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Gestionnaire pour l'aide DNS
  const handleDnsHelp = () => {
    showDnsTroubleshootingToast();
  };

  return (
    <>
      {/* Alerte de problème réseau/DNS */}
      {networkIssue.show && (
        <div className="sticky top-0 z-50 w-full px-4 py-2">
          <NetworkStatusAlert 
            isOnline={networkIssue.isOnline} 
            onHelp={handleDnsHelp}
            className="mx-auto max-w-md shadow-lg"
          />
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard/*" element={
          <>
            <AnalysisController />
            <Dashboard />
          </>
        } />
        <Route path="/about" element={<About />} />
        <Route path="/offres" element={<Offres />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
