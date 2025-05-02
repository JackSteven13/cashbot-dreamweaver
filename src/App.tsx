
import { AuthProvider } from './hooks/useAuth.tsx'; // Change the path to use .tsx extension
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import useAuthProvider from './hooks/auth/useAuthProvider';
import { useEffect } from 'react';

// Composant de récupération en cas d'erreur DNS
const DNSErrorRecovery = () => {
  useEffect(() => {
    const checkDNS = () => {
      const img = new Image();
      img.src = `https://www.google.com/favicon.ico?${new Date().getTime()}`;
      return new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error("DNS error"));
        setTimeout(() => reject(new Error("DNS timeout")), 5000);
      });
    };

    checkDNS().catch(error => {
      console.warn("DNS check failed:", error);
    });

    // Vérifier périodiquement
    const intervalId = setInterval(() => {
      checkDNS().catch(() => {
        console.log("Attempting recovery for DNS issues...");
      });
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
  
  // Ajouter un effet pour détecter les problèmes DNS
  useEffect(() => {
    const handleOffline = () => {
      console.warn("Application is offline - waiting for connectivity");
    };
    
    const handleOnline = () => {
      console.log("Application is back online - resuming normal operation");
      window.location.reload();
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
  // Redirection immédiate si on est sur le domaine .fr
  useEffect(() => {
    if (window.location.hostname.includes('streamgenius.fr')) {
      window.location.replace(`https://streamgenius.io${window.location.pathname}${window.location.search}?source=app_component&t=${Date.now()}`);
    }
  }, []);

  return (
    <AuthProvider>
      <DNSErrorRecovery />
      <AuthSecurityWrapper />
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
