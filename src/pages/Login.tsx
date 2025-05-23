
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData, supabase } from "@/integrations/supabase/client";
import AuthCleanup from '@/components/auth/login/AuthCleanup';

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();
  const cleanupDone = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Nettoyage des données d'authentification au chargement de la page
  useEffect(() => {    
    const initAuth = async () => {
      if (cleanupDone.current) return;
      cleanupDone.current = true;
      
      // Nettoyage complet des données d'authentification
      clearStoredAuthData();
      
      // Tentative de déconnexion pour s'assurer d'un état propre
      try {
        await supabase.auth.signOut();
        
        // Vérifier si l'URL contient un token ou hash d'authentification
        const hasAuthParams = window.location.hash.includes('access_token') || 
                              window.location.hash.includes('error_code') ||
                              window.location.search.includes('error_code');
                              
        // Nettoyer l'URL si elle contient des paramètres d'authentification
        if (hasAuthParams) {
          window.history.replaceState(null, document.title, window.location.pathname);
        }
        
      } catch (err) {
        console.log("Erreur lors de l'initialisation:", err);
      }
      
      setIsInitialized(true);
    };
    
    initAuth();
    
    // S'assurer que le HTML a bien le mode sombre appliqué
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Nettoyage supplémentaire des données d'authentification */}
      <AuthCleanup />
      
      <main className="flex-1 flex items-center justify-center pt-28 pb-12">
        <LoginContainer lastLoggedInEmail={lastLoggedInEmail} />
      </main>
    </div>
  );
};

export default Login;
