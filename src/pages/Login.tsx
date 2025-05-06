
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { createClient, clearAuthData } from '@/lib/supabase';

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();
  const supabase = createClient();

  // Nettoyage complet au chargement de la page de login
  useEffect(() => {    
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage des données d'authentification");
        
        // Nettoyage complet
        clearAuthData();
        
        // Déconnexion explicite
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.log("Erreur de déconnexion ignorée:", e);
        }
        
        // Second nettoyage pour s'assurer que tout est propre
        setTimeout(clearAuthData, 300);
        
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
