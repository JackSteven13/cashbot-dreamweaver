
import { FC, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAuth, refreshSession } from "@/utils/auth/index";

interface DashboardAuthCheckerProps {
  setIsAuthChecking: (value: boolean) => void;
  setAuthError: (value: boolean) => void;
}

const DashboardAuthChecker: FC<DashboardAuthCheckerProps> = ({ 
  setIsAuthChecking,
  setAuthError
}) => {
  const navigate = useNavigate();
  const authCheckInProgress = useRef(false);
  
  const checkAuth = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return false;
    }
    
    try {
      authCheckInProgress.current = true;
      
      // Essayer de rafraîchir la session avant tout
      await refreshSession();
      
      // Petit délai pour permettre au rafraîchissement de se propager
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const isAuthenticated = await verifyAuth();
      
      authCheckInProgress.current = false;
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
        setAuthError(true);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 400);
        return false;
      }
      
      console.log("Active session found, initializing dashboard");
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(true);
      authCheckInProgress.current = false;
      return false;
    }
  }, [navigate, setAuthError]);

  return null; // This is a functional component with no UI
};

export default DashboardAuthChecker;
