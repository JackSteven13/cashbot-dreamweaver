
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
  // Force HTTPS in production with more specific conditions
  React.useEffect(() => {
    // Check if we're not on localhost and not using HTTPS
    if (
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1' && 
      window.location.protocol === 'http:'
    ) {
      // Force redirect to HTTPS
      window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}`);
    }
    
    // Add specific check for streamgenius.io domain
    if (
      window.location.hostname === 'www.streamgenius.io' &&
      window.location.protocol === 'https:'
    ) {
      // Redirect www to non-www
      window.location.replace(`https://streamgenius.io${window.location.pathname}${window.location.search}`);
    }
    
    // Force dark mode class on document for consistent appearance
    document.documentElement.classList.add('dark');
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
