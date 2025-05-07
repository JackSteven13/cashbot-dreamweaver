
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { supabase, clearStoredAuthData, checkNetworkConnectivity } from "@/lib/supabase";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage initial au chargement de la page
  useEffect(() => {    
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage des données d'authentification");
        
        // Premier nettoyage
        clearStoredAuthData();
        
        // Déconnexion explicite
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (err) {
          console.error("Erreur lors de la déconnexion:", err);
        }
        
        // Second nettoyage après déconnexion
        clearStoredAuthData();
        
        // Vérifier la connectivité au serveur
        const isConnected = await checkNetworkConnectivity();
        if (!isConnected) {
          console.warn("⚠️ Connectivité au serveur limitée détectée");
        } else {
          console.log("✅ Connectivité au serveur confirmée");
        }
      } catch (err) {
        console.error("Erreur de nettoyage d'authentification:", err);
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
