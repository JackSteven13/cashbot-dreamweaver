
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Offres from "./pages/Offres";
import Register from "./pages/Register";
import Login from "./pages/Login";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import ProtectedRoute from "./components/ProtectedRoute";
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';

const queryClient = new QueryClient();

const AppRoutes = () => {
  // Check for redirections from 404 page
  useEffect(() => {
    const redirectedFrom = sessionStorage.getItem('redirectedFrom');
    if (redirectedFrom) {
      sessionStorage.removeItem('redirectedFrom');
      console.log('Redirected from:', redirectedFrom);
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/about" element={<About />} />
      <Route path="/offres" element={<Offres />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/payment" element={
        <ProtectedRoute>
          <Payment />
        </ProtectedRoute>
      } />
      <Route path="/payment-success" element={
        <ProtectedRoute>
          <PaymentSuccess />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
