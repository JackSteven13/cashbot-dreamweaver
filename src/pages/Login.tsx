
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { createClient } from '@/lib/supabase';

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();
  const supabase = createClient();

  // Nettoyage complet au chargement de la page de login
  useEffect(() => {    
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage des données d'authentification");
        
        // Déconnexion explicite
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.log("Erreur de déconnexion ignorée:", e);
        }
        
        // Nettoyage des tokens
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        
        // Supprimer tous les cookies d'authentification
        document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        console.log("Nettoyage terminé");
      } catch (err) {
        console.error("Erreur lors du nettoyage:", err);
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
