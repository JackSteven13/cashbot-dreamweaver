
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage initial au chargement de la page
  useEffect(() => {    
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage des données d'authentification");
        
        // Premier nettoyage
        clearStoredAuthData();
        
        // Déconnexion explicite
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error("Erreur lors de la déconnexion:", err);
        }
        
        // Second nettoyage après déconnexion
        clearStoredAuthData();
      } catch (err) {
        console.error("Erreur de nettoyage d'authentification:", err);
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
