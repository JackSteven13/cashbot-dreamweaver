
import { AuthProvider } from './hooks/useAuth.tsx';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { useEffect } from 'react';
import NetworkStatusMonitor from './components/NetworkStatusMonitor';
import { supabase } from '@/integrations/supabase/client';

function App() {
  // Application des redirections HTTPS immédiatement
  useEffect(() => {
    // Force HTTPS pour toutes les connexions
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}`);
      return;
    }
    
    // Force redirection de streamgenius.fr vers streamgenius.io
    if (
      window.location.hostname === 'streamgenius.fr' || 
      window.location.hostname === 'www.streamgenius.fr'
    ) {
      window.location.replace(`https://streamgenius.io${window.location.pathname}${window.location.search}`);
      return;
    }
    
    // Force redirection de www vers non-www
    if (window.location.hostname === 'www.streamgenius.io') {
      window.location.replace(`https://streamgenius.io${window.location.pathname}${window.location.search}`);
      return;
    }
    
    // Pré-initialisation de Supabase avec temporisation pour éviter les conflits
    const initTimer = setTimeout(() => {
      try {
        supabase.auth.getSession();
      } catch (e) {
        console.warn("Initialisation proactive de Supabase:", e);
      }
    }, 800);
    
    return () => clearTimeout(initTimer);
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
