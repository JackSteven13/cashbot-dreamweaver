
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { supabase, clearStoredAuthData } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage initial des données d'authentification
  useEffect(() => {
    const cleanupAuth = async () => {
      console.log("Page Login: Nettoyage des données d'authentification");
      
      // Nettoyer stockage local
      clearStoredAuthData();
      
      try {
        // Vérifier si on est déjà connecté
        const { data } = await supabase.auth.getSession();
        
        // Si connecté, déconnexion globale
        if (data.session) {
          console.log("Session active détectée, déconnexion...");
          
          try {
            await supabase.auth.signOut({ scope: 'global' });
            console.log("Déconnexion réussie");
          } catch (signoutErr) {
            console.error("Erreur lors de la déconnexion:", signoutErr);
            // Continuer même en cas d'erreur - le nettoyage local est suffisant
          }
        }
      } catch (err) {
        // Ignorer les erreurs pendant le nettoyage initial
        console.log("Erreur ignorée lors de la vérification/déconnexion:", err);
      }
      
      // Ajouter un délai pour permettre au navigateur de se stabiliser
      setTimeout(() => {
        console.log("Nettoyage terminé, page de connexion prête");
      }, 100);
    };
    
    cleanupAuth();
    
    // Afficher un toast pour indiquer que la page est prête
    setTimeout(() => {
      if (navigator.onLine) {
        toast({
          title: "Prêt pour la connexion",
          description: "Page de connexion initialisée correctement.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Mode hors ligne",
          description: "Vérifiez votre connexion réseau pour vous connecter.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }, 500);
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
