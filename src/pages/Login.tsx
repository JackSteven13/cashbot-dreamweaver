
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage radical au chargement de la page
  useEffect(() => {
    console.log("Page de connexion chargée, nettoyage radical des données d'authentification");
    clearStoredAuthData();
    
    // Répéter le nettoyage après un court délai pour s'assurer que tout est bien nettoyé
    const cleanupTimeout = setTimeout(clearStoredAuthData, 500);
    return () => clearTimeout(cleanupTimeout);
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
