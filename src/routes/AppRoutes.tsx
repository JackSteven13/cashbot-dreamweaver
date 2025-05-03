
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

const AppRoutes: React.FC = () => {
  // Force HTTPS and handle domain redirections
  useEffect(() => {
    // HTTPS Enforcement
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      window.location.replace(`https://${window.location.host}${window.location.pathname}`);
      return;
    }
    
    // PRIORITÉ MAXIMALE: Redirect from streamgenius.fr to streamgenius.io
    if (
      window.location.hostname === 'streamgenius.fr' || 
      window.location.hostname === 'www.streamgenius.fr'
    ) {
      console.log("Redirection .fr vers .io activée");
      window.location.replace(`https://streamgenius.io${window.location.pathname}`);
      return;
    }
    
    // Redirect www to non-www for streamgenius.io
    if (window.location.hostname === 'www.streamgenius.io') {
      window.location.replace(`https://streamgenius.io${window.location.pathname}`);
      return;
    }
    
    // Force dark mode for consistent appearance
    document.documentElement.classList.add('dark');
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
