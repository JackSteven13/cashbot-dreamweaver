
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthCleanup from '@/components/auth/login/AuthCleanup';
import LoadingScreen from '@/components/auth/login/LoadingScreen';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const { isCheckingSession, lastLoggedInEmail } = useLoginSession();

  // Préparation spéciale pour la page de connexion
  useEffect(() => {
    // Initialisation immédiate de Supabase pour préparer la connexion
    const prepareAuthEnvironment = async () => {
      console.log("Préparation de l'environnement d'authentification");
      
      try {
        // Forcer une connexion pour vérifier que le serveur est accessible
        await supabase.auth.getSession();
        console.log("Session Supabase récupérée avec succès");
      } catch (e) {
        console.error("Erreur lors de la préparation de l'environnement d'authentification:", e);
        toast({
          title: "Problème de connexion",
          description: "Un problème de connexion au serveur a été détecté. Si l'erreur persiste, essayez de vous reconnecter plus tard.",
          variant: "destructive"
        });
      }
    };
    
    prepareAuthEnvironment();
  }, []);

  // Si on vérifie encore la session, afficher un loader amélioré
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
