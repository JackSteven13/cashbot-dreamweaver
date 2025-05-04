
import { AuthProvider } from './hooks/useAuth.tsx';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { useEffect } from 'react';
import NetworkStatusMonitor from './components/NetworkStatusMonitor';
import { supabase } from '@/integrations/supabase/client';

function App() {
  // Initialisation précoce de la connexion Supabase
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
    
    // Préchauffage de la connexion Supabase
    try {
      // Test de connexion immédiat à Supabase
      supabase.auth.getSession().catch(() => {});
      
      // Vérifications périodiques de la connexion
      const interval = setInterval(() => {
        if (navigator.onLine) {
          supabase.auth.getSession().catch(() => {});
        }
      }, 5000);
      
      return () => clearInterval(interval);
    } catch (e) {
      console.warn("Erreur lors de l'initialisation de la connexion:", e);
    }
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
