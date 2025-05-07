
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData, supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage radical des données d'authentification au chargement de la page
  useEffect(() => {    
    const cleanupAuth = async () => {
      // Nettoyage complet des données d'authentification
      clearStoredAuthData();
      
      // Tentative de déconnexion pour s'assurer d'un état propre
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log("Déconnexion complète effectuée");
        
        // Attendre un moment pour s'assurer que tout est bien nettoyé
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Second nettoyage après la déconnexion
        clearStoredAuthData();
      } catch (err) {
        // Ignorer les erreurs et continuer
        console.log("Note: déconnexion ignorée, poursuite du chargement");
      }
    };
    
    cleanupAuth();
    
    // Vérifier si un header X-Supabase-Auth est présent dans le localStorage
    const checkHeaders = () => {
      try {
        const authHeaderKey = Object.keys(localStorage).find(key => 
          key.toLowerCase().includes('supabase') && 
          key.toLowerCase().includes('header')
        );
        
        if (authHeaderKey) {
          localStorage.removeItem(authHeaderKey);
          console.log("En-tête d'authentification Supabase nettoyé");
        }
      } catch (e) {
        // Ignorer les erreurs
      }
    };
    
    checkHeaders();
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
