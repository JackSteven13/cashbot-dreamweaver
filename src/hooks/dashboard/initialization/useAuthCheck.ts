
import { useCallback } from 'react';
import { verifyAuth, refreshSession } from "@/utils/auth/index";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

interface UseAuthCheckParams {
  mountedRef: React.RefObject<boolean>;
}

export const useAuthCheck = ({ mountedRef }: UseAuthCheckParams) => {
  const navigate = useNavigate();
  
  const checkAuth = useCallback(async () => {
    try {
      console.log("Dashboard initializing: checking auth state");
      
      // Prevent multiple concurrent auth checks
      const authCheckingFlag = localStorage.getItem('auth_checking');
      if (authCheckingFlag === 'true') {
        console.log("Auth check already in progress, waiting");
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      localStorage.setItem('auth_checking', 'true');
      
      // Check if a session is present locally first
      const localSession = localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      if (!localSession) {
        console.log("No local session found, redirecting to login");
        
        if (mountedRef.current) {
          // Clean up flags
          localStorage.removeItem('auth_checking');
          
          // Delay redirect to prevent race conditions
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
            }
          }, 300);
        }
        
        return false;
      }
      
      // Attempt to refresh the session
      try {
        if (localStorage.getItem('auth_refreshing') !== 'true') {
          localStorage.setItem('auth_refreshing', 'true');
          await refreshSession();
          localStorage.removeItem('auth_refreshing');
          
          // Small delay to allow refresh to propagate
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (refreshError) {
        localStorage.removeItem('auth_refreshing');
        console.log("Session refresh failed, will try existing session", refreshError);
      }
      
      if (!mountedRef.current) {
        localStorage.removeItem('auth_checking');
        return false;
      }
      
      const isAuthenticated = await verifyAuth();
      
      if (!mountedRef.current) {
        localStorage.removeItem('auth_checking');
        return false;
      }
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
        
        // Force clear auth tokens
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        localStorage.removeItem('auth_checking');
        
        if (mountedRef.current) {
          toast({
            title: "Session expirée",
            description: "Votre session a expiré. Veuillez vous reconnecter.",
            variant: "destructive"
          });
          
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
            }
          }, 300);
        }
        
        return false;
      }
      
      console.log("Active session found, continuing dashboard initialization");
      localStorage.removeItem('auth_checking');
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_checking');
      
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
