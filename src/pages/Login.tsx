
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { supabase, clearStoredAuthData } from "@/lib/supabase";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage initial des données d'authentification
  useEffect(() => {
    const cleanupAuth = async () => {
      // Nettoyer stockage local
      clearStoredAuthData();
      
      try {
        // Vérifier si on est déjà connecté
        const { data } = await supabase.auth.getSession();
        
        // Si connecté, déconnexion globale
        if (data.session) {
          console.log("Session active détectée, déconnexion...");
          await supabase.auth.signOut({ scope: 'global' });
          console.log("Déconnexion réussie");
        }
      } catch (err) {
        // Ignorer les erreurs - le nettoyage local est suffisant
        console.log("Erreur ignorée lors de la vérification/déconnexion:", err);
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
