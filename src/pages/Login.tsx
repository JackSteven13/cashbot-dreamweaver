
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData, supabase, checkSupabaseConnectivity } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();
  const [connectivityChecked, setConnectivityChecked] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Nettoyage radical des données d'authentification au chargement de la page
  // et vérification de connectivité
  useEffect(() => {    
    const initAuth = async () => {
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
        
        // Vérifier la connectivité avec Supabase
        const connected = await checkSupabaseConnectivity();
        setIsConnected(connected);
        setConnectivityChecked(true);
        
        if (!connected) {
          console.error("Problème de connectivité avec Supabase détecté");
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
