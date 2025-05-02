
import React, { useEffect } from 'react';
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
import { hasValidConnection } from '@/utils/auth';

const AppRoutes: React.FC = () => {
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
    
    // DNS Error detection and recovery avec amélioration
    const checkConnectivity = async () => {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        toast.error("Problème de connexion réseau. Vérifiez votre connexion internet.");
        return;
      }
      
      try {
        // Utiliser notre fonction améliorée pour vérifier la connexion
        const hasConnection = await hasValidConnection();
        
        if (!hasConnection) {
          toast.error("Problème de DNS détecté. Essayez de vider votre cache DNS.", {
            duration: 8000,
            action: {
              label: "Aide",
              onClick: () => {
                toast.info("Conseil: Essayez de basculer sur les données mobiles ou un autre réseau WiFi.", {
                  duration: 8000
                });
              }
            }
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

  return (
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
  );
};

export default AppRoutes;
