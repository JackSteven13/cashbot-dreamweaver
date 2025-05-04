
import { AuthProvider } from './hooks/useAuth.tsx';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { useEffect } from 'react';
import NetworkStatusMonitor from './components/NetworkStatusMonitor';
import { supabase } from '@/integrations/supabase/client';

function App() {
  // Application des redirections HTTPS et préparation de l'authentification immédiatement
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
    
    // Initialisation immédiate de Supabase pour préparer l'environnement
    try {
      // Pré-initialisation de la connexion API - cruciale pour résoudre les problèmes de connexion
      supabase.auth.getSession().catch(e => console.log("Initialisation proactive de Supabase:", e));
      
      // Préparation aux problèmes de connectivité en pré-initialisant plusieurs fois
      const intervalId = setInterval(() => {
        if (window.location.pathname.includes('login')) {
          supabase.auth.getSession().catch(e => console.log("Refresh de connexion Supabase:", e));
        }
      }, 3000);
      
      return () => clearInterval(intervalId);
    } catch (e) {
      console.warn("Erreur lors de l'initialisation proactive:", e);
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
