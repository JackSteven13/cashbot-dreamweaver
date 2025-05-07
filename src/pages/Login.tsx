
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData, supabase } from "@/lib/supabase";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage initial des données d'authentification
  useEffect(() => {
    const cleanupAuth = async () => {
      // Nettoyage local
      clearStoredAuthData();
      
      // Tentative de déconnexion
      try {
        await supabase.auth.signOut();
      } catch (err) {
        // Ignorer les erreurs - le nettoyage local est suffisant
        console.log("Erreur ignorée lors de la déconnexion:", err);
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
