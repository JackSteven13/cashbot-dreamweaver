
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
        
        // Déconnexion explicite de Supabase
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (err) {
          console.error("Erreur lors de la déconnexion:", err);
          // Continuer malgré l'erreur
        }
        
        // Attendre que la déconnexion soit traitée
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Deuxième nettoyage
        clearStoredAuthData();
        
        // Vérifier qu'aucune session n'est présente
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            console.warn("Session toujours présente après nettoyage");
            try {
              supabase.auth.signOut();
            } catch (err) {
              // Ignorer l'erreur
            }
            clearStoredAuthData();
          } else {
            console.log("Confirmation: aucune session active");
          }
        });
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
