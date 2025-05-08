
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData, supabase, checkSupabaseConnectivity } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();
  const [connectivityChecked, setConnectivityChecked] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const cleanupDone = useRef(false);

  // Nettoyage radical des données d'authentification au chargement de la page
  // et vérification de connectivité
  useEffect(() => {    
    const initAuth = async () => {
      if (cleanupDone.current) return;
      cleanupDone.current = true;
      
      console.log("Initialisation de l'authentification...");
      
      // Nettoyage complet des données d'authentification
      clearStoredAuthData();
      
      // Tentative de déconnexion pour s'assurer d'un état propre
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log("Déconnexion effectuée avec succès");
        
        // Second nettoyage après la déconnexion pour être certain
        clearStoredAuthData();
        
        // Vérifier si l'URL contient un token ou hash d'authentification
        const hasAuthParams = window.location.hash.includes('access_token') || 
                              window.location.hash.includes('error_code') ||
                              window.location.search.includes('error_code');
                              
        // Nettoyer l'URL si elle contient des paramètres d'authentification
        if (hasAuthParams) {
          window.history.replaceState(null, document.title, window.location.pathname);
        }
        
        // Vérifier la connectivité avec Supabase avec système de retry
        let retryCount = 0;
        const maxRetries = 3;
        let connected = false;
        
        while (retryCount < maxRetries && !connected) {
          console.log(`Vérification de la connectivité Supabase (tentative ${retryCount + 1}/${maxRetries})...`);
          connected = await checkSupabaseConnectivity();
          
          if (!connected && retryCount < maxRetries - 1) {
            console.log("Échec de connexion, nouvelle tentative dans 1s...");
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          retryCount++;
        }
        
        setIsConnected(connected);
        setConnectivityChecked(true);
        
        if (!connected) {
          console.error("Problème persistant de connectivité avec Supabase détecté");
        } else {
          console.log("Connexion à Supabase établie avec succès");
        }
      } catch (err) {
        console.log("Erreur lors de l'initialisation:", err);
        setIsConnected(true); // Par défaut, on suppose que la connexion est OK
        setConnectivityChecked(true);
      }
    };
    
    initAuth();
    
    // S'assurer que le HTML a bien le mode sombre appliqué
    document.documentElement.classList.add('dark');
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
