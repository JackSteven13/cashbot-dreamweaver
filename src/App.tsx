
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
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
import AccessGate from './pages/AccessGate';

const queryClient = new QueryClient();

// HOC pour vérifier le code d'accès
const CodeProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isCodeVerified, setIsCodeVerified] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAccessCode = () => {
      const verified = localStorage.getItem('access_code_verified') === 'true';
      setIsCodeVerified(verified);
    };
    
    checkAccessCode();
    
    // Re-vérifier si le localStorage change
    window.addEventListener('storage', checkAccessCode);
    return () => {
      window.removeEventListener('storage', checkAccessCode);
    };
  }, []);
  
  // Pendant la vérification, ne rien afficher
  if (isCodeVerified === null) {
    return null;
  }
  
  // Si non vérifié, rediriger vers la page d'accès
  if (!isCodeVerified) {
    const currentPath = window.location.pathname;
    return <Navigate to={`/access?from=${encodeURIComponent(currentPath)}`} replace />;
  }
  
  // Si vérifié, afficher le contenu
  return <>{children}</>;
};

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
      <Route path="/access" element={<AccessGate />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Routes protégées par code d'accès */}
      <Route path="/" element={
        <CodeProtectedRoute>
          <Index />
        </CodeProtectedRoute>
      } />
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/about" element={
        <CodeProtectedRoute>
          <About />
        </CodeProtectedRoute>
      } />
      <Route path="/offres" element={
        <CodeProtectedRoute>
          <Offres />
        </CodeProtectedRoute>
      } />
      <Route path="/terms" element={
        <CodeProtectedRoute>
          <Terms />
        </CodeProtectedRoute>
      } />
      <Route path="/contact" element={
        <CodeProtectedRoute>
          <Contact />
        </CodeProtectedRoute>
      } />
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

// Fix: Create a proper functional component for the app root
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <BrowserRouter>
          {/* Fix: Move TooltipProvider inside the React component tree */}
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
