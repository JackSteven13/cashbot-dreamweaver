
import { AuthProvider } from './hooks/useAuth.tsx';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { useEffect } from 'react';
import NetworkStatusMonitor from './components/NetworkStatusMonitor';
import { supabase } from '@/integrations/supabase/client';

// Composant de récupération en cas d'erreur DNS et d'application HTTPS
const SecurityAndDNSHandler = () => {
  useEffect(() => {
    // Force HTTPS - Critical Security Check
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      console.warn("SECURITY ALERT: Protocol insecure, forcing HTTPS...");
      window.location.replace(`https://${window.location.host}${window.location.pathname}`);
      return;
    }
    
    // Redirection .fr vers .io immédiate
    if (window.location.hostname.includes('streamgenius.fr')) {
      console.log("Redirection immédiate .fr vers .io");
      window.location.replace(`https://streamgenius.io${window.location.pathname}`);
      return;
    }

    // Forcer la reconnexion de Supabase après un délai pour résoudre les problèmes potentiels
    setTimeout(() => {
      try {
        supabase.auth.getSession();
      } catch (e) {
        console.warn("Reconnexion proactive de Supabase:", e);
      }
    }, 1000);
  }, []);

  return null;
};

function App() {
  // Forcer HTTPS immédiatement
  useEffect(() => {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      window.location.replace(`https://${window.location.host}${window.location.pathname}`);
    }
    
    // Redirection immédiate si on est sur le domaine .fr
    if (window.location.hostname.includes('streamgenius.fr')) {
      window.location.replace(`https://streamgenius.io${window.location.pathname}`);
    }
  }, []);

  return (
    <AuthProvider>
      <SecurityAndDNSHandler />
      <AppRoutes />
      <NetworkStatusMonitor />
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
