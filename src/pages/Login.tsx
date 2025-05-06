
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage radical au chargement de la page de login
  useEffect(() => {    
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage complet des données d'authentification");
        
        // Déconnexion explicite avec champ d'application global
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.log("Erreur de déconnexion ignorée:", e);
        }
        
        // Premier nettoyage
        clearStoredAuthData();
        
        // Attendre que la déconnexion soit traitée
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Deuxième nettoyage pour s'assurer que tout est propre
        clearStoredAuthData();
        
        // Vérification finale après un délai
        setTimeout(() => {
          // S'assurer qu'aucune session ne persiste
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
        // Tentative finale de nettoyage
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
