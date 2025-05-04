
import { AuthProvider } from './hooks/useAuth.tsx';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { useEffect } from 'react';
import NetworkStatusMonitor from './components/NetworkStatusMonitor';
import { supabase } from '@/integrations/supabase/client';

function App() {
  // Forcer HTTPS immédiatement
  useEffect(() => {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      window.location.replace(`https://${window.location.host}${window.location.pathname}`);
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

  return (
    <AuthProvider>
      <AppRoutes />
      <NetworkStatusMonitor />
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
