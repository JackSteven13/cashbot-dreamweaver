
import { AuthProvider } from './hooks/useAuth.tsx';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { useEffect } from 'react';
import NetworkStatusMonitor from './components/NetworkStatusMonitor';
import { supabase } from '@/integrations/supabase/client';

function App() {
  // Initialisation précoce et réchauffement de la connexion
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
    
    // Préchauffage des connexions réseau
    const warmupConnections = async () => {
      try {
        // Initialisation et réchauffement de Supabase
        await supabase.auth.getSession().catch(() => {});
        
        // Vérifier périodiquement la connexion et maintenir au chaud
        const interval = setInterval(() => {
          if (navigator.onLine) {
            // Faire une demande silencieuse pour maintenir la connexion
            supabase.auth.getSession().catch(() => {});
          }
        }, 30000);
        
        // Nettoyer l'intervalle lors du démontage
        return () => clearInterval(interval);
      } catch (e) {
        console.warn("Erreur lors de l'initialisation des connexions:", e);
      }
    };
    
    warmupConnections();
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
