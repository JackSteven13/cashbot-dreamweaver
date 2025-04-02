
import { useCallback } from 'react';
import { verifyAuth, refreshSession } from "@/utils/auth/index";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

interface UseAuthCheckParams {
  mountedRef: React.RefObject<boolean>;
}

export const useAuthCheck = ({ mountedRef }: UseAuthCheckParams) => {
  const navigate = useNavigate();
  
  // Fonction améliorée pour vérifier l'authentification avec stabilité accrue
  const checkAuth = useCallback(async () => {
    try {
      console.log("Dashboard initializing: checking auth state");
      
      // Vérifier d'abord si une session est présente localement
      const localSession = localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      if (!localSession) {
        console.log("No local session found, redirecting to login");
        
        if (mountedRef.current) {
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 300);
        }
        
        return false;
      }
      
      // Essayer de rafraîchir la session avant tout pour une meilleure résilience
      try {
        await refreshSession();
        
        // Petit délai pour permettre au rafraîchissement de se propager
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (refreshError) {
        console.log("Session refresh failed, will try to verify existing session", refreshError);
        // Continue with verification even if refresh fails
      }
      
      const isAuthenticated = await verifyAuth();
      
      if (!mountedRef.current) {
        console.log("Component unmounted during auth check");
        return false;
      }
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
        
        // Force clear auth tokens to ensure clean state
        try {
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
          localStorage.removeItem('supabase.auth.token');
        } catch (e) {
          console.error("Failed to clear auth tokens:", e);
        }
        
        // Show toast for better user feedback
        toast({
          title: "Session expirée",
          description: "Votre session a expiré. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        
        return false;
      }
      
      console.log("Active session found, continuing dashboard initialization");
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      
      if (mountedRef.current) {
        // Show toast for better user feedback
        toast({
          title: "Erreur d'authentification",
          description: "Un problème est survenu. Veuillez réessayer.",
          variant: "destructive"
        });
      }
      
      return false;
    }
  }, [mountedRef, navigate]);

  return { checkAuth };
};
