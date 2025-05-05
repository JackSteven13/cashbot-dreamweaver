
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage radical au chargement de la page
  useEffect(() => {    
    // Déconnexion et nettoyage complet
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage complet des données d'authentification au chargement de Login");
        
        // Premier nettoyage exhaustif
        clearStoredAuthData();
        
        // Déconnexion explicite de Supabase
        await supabase.auth.signOut({ scope: 'global' });
        
        // Second nettoyage après la déconnexion
        clearStoredAuthData();
        
        // Délai court puis troisième nettoyage pour s'assurer que tout est propre
        setTimeout(() => {
          clearStoredAuthData();
        }, 500);
      } catch (err) {
        console.error("Erreur de nettoyage d'authentification:", err);
        // Malgré l'erreur, tenter un dernier nettoyage
        clearStoredAuthData();
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
