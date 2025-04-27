
import React, { lazy, Suspense } from 'react';
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

// Memoize AnalysisController with Dashboard to prevent unnecessary re-renders
const DashboardWithAnalysis = React.memo(() => (
  <>
    <AnalysisController />
    <Dashboard />
  </>
));

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard/*" element={<DashboardWithAnalysis />} />
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
