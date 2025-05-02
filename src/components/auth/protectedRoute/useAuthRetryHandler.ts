
import { useCallback, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { forceSignOut } from '@/utils/auth';

export const useAuthRetryHandler = () => {
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  
  const handleCleanLoginSafely = useCallback((redirectInProgress: React.MutableRefObject<boolean>) => {
    if (redirectAttempts >= 3) {
      // Si trop de redirections, forcer une déconnexion complète
      forceSignOut().then(() => {
        window.location.href = '/login';
      });
      return;
    }
    
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      setRedirectAttempts(prev => prev + 1);
      
      // Forcer la suppression de tous les tokens et flags
      try {
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        localStorage.removeItem('auth_checking');
        localStorage.removeItem('auth_refreshing');
        localStorage.removeItem('auth_redirecting');
        localStorage.removeItem('auth_check_timestamp');
      } catch (e) {
        console.error("Erreur lors du nettoyage du localStorage:", e);
      }
      
      toast({
        title: "Problème d'authentification",
        description: "Veuillez vous reconnecter",
        variant: "destructive"
      });
      
      // Utiliser une redirection directe pour éviter les problèmes de React Router
      window.location.href = '/login';
    }
  }, [redirectAttempts]);

  return {
    redirectAttempts,
    handleCleanLoginSafely
  };
};

export default useAuthRetryHandler;
