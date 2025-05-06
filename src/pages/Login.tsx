
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage radical au chargement de la page
  useEffect(() => {    
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage complet des données d'authentification");
        
        // Premier nettoyage
        clearStoredAuthData();
        
        // Déconnexion explicite de Supabase avec champ d'application global
        await supabase.auth.signOut({ scope: 'global' });
        
        // Attendre que la déconnexion soit traitée
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Deuxième nettoyage pour s'assurer que tout est propre
        clearStoredAuthData();
        
        // Mieux viser les cookies en fonction des domaines potentiels
        const isProduction = window.location.hostname.endsWith('streamgenius.io');
        if (isProduction) {
          // Traiter spécifiquement streamgenius.io et sous-domaines
          document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=streamgenius.io;';
          document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=streamgenius.io;';
          document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io;';
          document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.streamgenius.io;';
        }
        
        // Nettoyage supplémentaire sans ciblage de domaine
        document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Vérification finale après un délai
        setTimeout(() => {
          clearStoredAuthData();
          
          // Vérifier qu'aucune session n'est présente
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
