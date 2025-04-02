
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { forceSignOut } from "@/utils/auth/sessionUtils";

/**
 * Hook for handling auth redirects
 */
export const useAuthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleCleanLogin = useCallback(() => {
    console.log("Déconnexion propre initiée");
    
    Promise.resolve(forceSignOut())
      .then(() => {
        console.log("Redirection vers la page de connexion");
        // Petit délai pour permettre à la déconnexion de se terminer
        setTimeout(() => {
          navigate('/login', { replace: true, state: { from: location } });
        }, 500);
      })
      .catch((error) => {
        console.error("Erreur pendant la déconnexion propre:", error);
        setTimeout(() => {
          navigate('/login', { replace: true, state: { from: location } });
        }, 500);
      });
  }, [navigate, location]);

  const redirectToLogin = useCallback((message: string = "Vous devez être connecté pour accéder à cette page.") => {
    toast({
      title: "Accès refusé",
      description: message,
      variant: "destructive"
    });
    
    navigate('/login', { replace: true, state: { from: location } });
  }, [navigate, location]);

  return {
    handleCleanLogin,
    redirectToLogin,
    location
  };
};
