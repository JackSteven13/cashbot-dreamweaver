
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearAuthData } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();
  const [connectionChecked, setConnectionChecked] = useState(false);
  const connectionAttempts = useRef(0);
  const maxConnectionAttempts = 3;
  
  // Fonction robuste pour vérifier la connectivité
  const checkConnection = async () => {
    if (connectionAttempts.current >= maxConnectionAttempts) {
      console.log("Nombre maximum de tentatives de vérification de connexion atteint");
      setConnectionChecked(true);
      return;
    }
    
    connectionAttempts.current++;
    console.log(`Tentative de vérification de connexion ${connectionAttempts.current}/${maxConnectionAttempts}`);
    
    // Vérifier si nous sommes en ligne selon le navigateur
    if (!navigator.onLine) {
      toast({
        title: "Problème de connexion",
        description: "Vérifiez votre connexion Internet pour pouvoir vous connecter",
        variant: "destructive",
        duration: 5000
      });
      setConnectionChecked(true);
      return;
    }
    
    // Test de connectivité réseau avec plusieurs méthodes
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Utiliser le point d'accès directement sans CORS
      await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/auth/v1/cookie', {
        method: 'GET',
        mode: 'no-cors', // Mode no-cors pour éviter les erreurs CORS
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      console.log("Test de connexion réseau réussi");
      setConnectionChecked(true);
    } catch (err) {
      console.error("Erreur de connexion au test de réseau:", err);
      
      // Si erreur, attendre et réessayer avec backoff exponentiel
      const retryDelay = Math.min(1000 * Math.pow(1.5, connectionAttempts.current), 5000);
      console.log(`Nouvelle tentative dans ${retryDelay}ms`);
      
      setTimeout(checkConnection, retryDelay);
      
      toast({
        title: "Problème de connexion",
        description: "Le service d'authentification semble inaccessible. Vérifiez votre connexion.",
        variant: "destructive",
        duration: 6000
      });
    }
  };
  
  // Vérifier la connexion réseau au chargement
  useEffect(() => {
    checkConnection();
  }, []);
  
  // Nettoyage complet au chargement de la page de login
  useEffect(() => {    
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage des données d'authentification");
        
        // Premier nettoyage immédiat
        clearAuthData();
        
        // Deuxième nettoyage après un délai
        setTimeout(clearAuthData, 800);
        
        console.log("Nettoyage terminé");
      } catch (err) {
        console.error("Erreur lors du nettoyage:", err);
      }
    };
    
    cleanupAuth();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-28 pb-12">
        <LoginContainer lastLoggedInEmail={lastLoggedInEmail} />
      </main>
    </div>
  );
};

export default Login;
