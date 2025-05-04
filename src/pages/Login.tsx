
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage radical au chargement de la page pour partir avec un état propre
  useEffect(() => {
    console.log("Page de connexion chargée, nettoyage radical des données d'authentification");
    
    const performCleanup = () => {
      // Nettoyer toutes les données d'authentification
      clearStoredAuthData();
    };
    
    // Exécuter immédiatement
    performCleanup();
    
    // Réexécuter après un court délai pour s'assurer que tout est propre
    const cleanupTimeout = setTimeout(performCleanup, 500);
    
    // Définir un intervalle pour nettoyer périodiquement (au cas où)
    const cleanupInterval = setInterval(performCleanup, 5000);
    
    return () => {
      clearTimeout(cleanupTimeout);
      clearInterval(cleanupInterval);
    };
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
