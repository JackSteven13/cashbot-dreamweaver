
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthCleanup from '@/components/auth/login/AuthCleanup';
import LoadingScreen from '@/components/auth/login/LoadingScreen';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData } from "@/integrations/supabase/client";

const Login = () => {
  const { isCheckingSession, lastLoggedInEmail } = useLoginSession();

  // Nettoyage complet au chargement de la page
  useEffect(() => {
    clearStoredAuthData();
    console.log("Données d'authentification nettoyées au chargement de la page de connexion");
  }, []);

  if (isCheckingSession) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AuthCleanup />
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-28 pb-12">
        <LoginContainer lastLoggedInEmail={lastLoggedInEmail} />
      </main>
    </div>
  );
};

export default Login;
