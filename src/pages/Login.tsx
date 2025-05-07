
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData, supabase } from "@/lib/supabase";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage initial des données d'authentification au chargement de la page
  useEffect(() => {    
    // Nettoyage complet des données d'authentification
    clearStoredAuthData();
    
    // Tentative de déconnexion globale pour s'assurer d'un état propre
    try {
      const handleSignOut = async () => {
        await supabase.auth.signOut({ scope: 'global' });
      };
      handleSignOut();
    } catch (err) {
      // Ignorer les erreurs, le nettoyage localStorage est suffisant
      console.log("Erreur lors de la déconnexion, ignorée:", err);
    }
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
