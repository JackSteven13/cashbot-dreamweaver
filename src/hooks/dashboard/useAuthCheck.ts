
import { useCallback } from 'react';
import { verifyAuth, refreshSession } from "@/utils/auth/index";

interface UseAuthCheckParams {
  mountedRef: React.RefObject<boolean>;
}

export const useAuthCheck = ({ mountedRef }: UseAuthCheckParams) => {
  // Fonction améliorée pour vérifier l'authentification avec stabilité accrue
  const checkAuth = useCallback(async () => {
    try {
      console.log("Dashboard initializing: checking auth state");
      
      // Essayer de rafraîchir la session avant tout pour une meilleure résilience
      await refreshSession();
      
      // Petit délai pour permettre au rafraîchissement de se propager
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isAuthenticated = await verifyAuth();
      
      if (!mountedRef.current) {
        console.log("Component unmounted during auth check");
        return false;
      }
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
        return false;
      }
      
      console.log("Active session found, continuing dashboard initialization");
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  }, [mountedRef]);

  return { checkAuth };
};
