
import { useCallback } from 'react';
import { verifyAuth, refreshSession } from "@/utils/auth/index";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

interface UseAuthCheckParams {
  mountedRef: React.RefObject<boolean>;
}

export const useAuthCheck = ({ mountedRef }: UseAuthCheckParams) => {
  const navigate = useNavigate();
  
  // Improved auth checking function with better error handling
  const checkAuth = useCallback(async () => {
    try {
      console.log("Dashboard initializing: checking auth state");
      
      // Vérifier si une redirection est déjà en cours
      const isRedirecting = localStorage.getItem('auth_redirecting') === 'true';
      if (isRedirecting) {
        console.log("Redirection already in progress, skipping auth check");
        return false;
      }
      
      // Check if a session is present locally first
      const localSession = localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      if (!localSession) {
        console.log("No local session found, redirecting to login");
        
        if (mountedRef.current) {
          // Set a flag to prevent multiple redirects
          localStorage.setItem('auth_redirecting', 'true');
          
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
              
              // Nettoyer le flag après redirection
              setTimeout(() => {
                localStorage.removeItem('auth_redirecting');
              }, 500);
            }
          }, 300);
        }
        
        return false;
      }
      
      // Attempt to refresh the session first for better resilience
      try {
        // Check if a refresh is already in progress
        if (localStorage.getItem('auth_refreshing') === 'true') {
          console.log("Session refresh already in progress, waiting");
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          localStorage.setItem('auth_refreshing', 'true');
          await refreshSession();
          localStorage.removeItem('auth_refreshing');
          
          // Small delay to allow refresh to propagate
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      } catch (refreshError) {
        localStorage.removeItem('auth_refreshing');
        console.log("Session refresh failed, will try to verify existing session", refreshError);
        // Continue with verification even if refresh fails
      }
      
      if (!mountedRef.current) return false;
      
      const isAuthenticated = await verifyAuth();
      
      if (!mountedRef.current) return false;
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
        
        // Force clear auth tokens to ensure clean state
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        
        // Show toast for better user feedback
        if (mountedRef.current) {
          toast({
            title: "Session expirée",
            description: "Votre session a expiré. Veuillez vous reconnecter.",
            variant: "destructive"
          });
          
          // Set a flag to prevent multiple redirects
          localStorage.setItem('auth_redirecting', 'true');
          
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
              
              // Nettoyer le flag après redirection
              setTimeout(() => {
                localStorage.removeItem('auth_redirecting');
              }, 500);
            }
          }, 300);
        }
        
        return false;
      }
      
      console.log("Active session found, continuing dashboard initialization");
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      localStorage.removeItem('auth_refreshing');
      
      if (mountedRef.current) {
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
