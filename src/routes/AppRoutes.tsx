
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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
    
    // DNS Error detection and recovery - version silencieuse
    const checkConnectivitySilently = async () => {
      try {
        // Vérification silencieuse sans notification à l'utilisateur
        const isOnline = await hasValidConnection();
        const dnsWorking = await checkDnsResolution();
        
        // Juste logger pour debug, aucune notification visible
        if (!isOnline) {
          console.log("Network connection issue detected");
        } else if (!dnsWorking) {
          console.log("DNS resolution issue detected");
        }
      } catch (error) {
        console.error("Error during connectivity check:", error);
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
    
    // Check DNS and connectivity on load silently
    checkConnectivitySilently();
    
    // Check periodically - moins souvent pour économiser les ressources
    const intervalId = setInterval(() => {
      enforceHttps();
      checkConnectivitySilently();
    }, 60000); // Check toutes les minutes
    
    // Force dark mode class on document for consistent appearance
    document.documentElement.classList.add('dark');
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <>      
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
