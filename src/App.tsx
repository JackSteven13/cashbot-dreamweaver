
import { AuthProvider } from './hooks/useAuth.tsx';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import useAuthProvider from './hooks/auth/useAuthProvider';
import { useEffect } from 'react';
import NetworkStatusMonitor from './components/NetworkStatusMonitor';

// Composant de récupération en cas d'erreur DNS et d'application HTTPS
const SecurityAndDNSHandler = () => {
  useEffect(() => {
    // Force HTTPS - Critical Security Check
    const enforceHttps = () => {
      if (window.location.hostname !== 'localhost' && 
          window.location.hostname !== '127.0.0.1' && 
          window.location.protocol === 'http:') {
        console.warn("SECURITY ALERT: Protocol insecure, forcing HTTPS...");
        window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}?secure=1&t=${Date.now()}`);
        return false;
      }
      return true;
    };
    
    // Exécuter les vérifications de sécurité
    enforceHttps();

    // Vérifier périodiquement
    const intervalId = setInterval(() => {
      enforceHttps();
    }, 30000);

    // Redirection .fr vers .io immédiate
    if (window.location.hostname.includes('streamgenius.fr')) {
      console.log("Redirection immédiate .fr vers .io");
      window.location.replace(`https://streamgenius.io${window.location.pathname}${window.location.search}?app_redirect=1&t=${Date.now()}`);
    }

    return () => clearInterval(intervalId);
  }, []);

  return null; // Ce composant ne rend rien visuellement
};

function AuthSecurityWrapper() {
  // Utiliser notre hook pour les vérifications de sécurité
  useAuthProvider();
  
  // Ajouter un effet pour détecter les problèmes DNS et forcer HTTPS
  useEffect(() => {
    // Forcer HTTPS partout
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}?secure=1&t=${Date.now()}`);
    }
    
    // Pas d'affichage à l'utilisateur en cas de problème de connectivité
    const handleOffline = () => {
      console.warn("Application is offline - waiting for connectivity");
    };
    
    const handleOnline = () => {
      console.log("Application is back online - resuming normal operation");
    };
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  return <AppRoutes />;
}

function App() {
  // Forcer HTTPS immédiatement
  useEffect(() => {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}?secure=1&t=${Date.now()}`);
    }
    
    // Redirection immédiate si on est sur le domaine .fr
    if (window.location.hostname.includes('streamgenius.fr')) {
      window.location.replace(`https://streamgenius.io${window.location.pathname}${window.location.search}?source=app_component&t=${Date.now()}`);
    }
  }, []);

  return (
    <AuthProvider>
      <SecurityAndDNSHandler />
      <AuthSecurityWrapper />
      <NetworkStatusMonitor /> {/* Gardé pour les vérifications en arrière-plan mais ne montre plus rien */}
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
