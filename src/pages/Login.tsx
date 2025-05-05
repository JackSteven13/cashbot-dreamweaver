
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage radical au chargement de la page avec retentatives
  useEffect(() => {    
    // Déconnexion et nettoyage complet
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage complet des données d'authentification au chargement de Login");
        
        // Premier nettoyage exhaustif
        clearStoredAuthData();
        
        // Déconnexion explicite de Supabase
        await supabase.auth.signOut({ scope: 'global' });
        
        // Ajouter un délai pour s'assurer que la déconnexion est traitée
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Second nettoyage après la déconnexion
        clearStoredAuthData();
        
        // Troisième nettoyage après un délai pour s'assurer que tout est propre
        setTimeout(() => {
          clearStoredAuthData();
        }, 500);
        
        // Quatrième nettoyage final après un délai plus long
        setTimeout(() => {
          // Suppression explicite des cookies spécifiques à Supabase
          document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io;';
          document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io;';
          
          // Suppression sans domaine
          document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          clearStoredAuthData();
          
          // Vérification finale de l'état de connexion
          supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
              console.warn("Session toujours présente après nettoyage, forçage supplémentaire");
              supabase.auth.signOut();
              clearStoredAuthData();
            } else {
              console.log("Confirmation: aucune session active");
            }
          });
        }, 1000);
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
