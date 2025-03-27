
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { forceSignOut } from "@/utils/auth/sessionUtils";
import { useAuthVerification } from '@/hooks/useAuthVerification';
import AuthRecoveryScreen from './auth/AuthRecoveryScreen';
import AuthLoadingScreen from './auth/AuthLoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectInProgress = useRef(false);
  const initialCheckComplete = useRef(false);
  const autoRetryCount = useRef(0);
  
  const { 
    isAuthenticated, 
    authCheckFailed, 
    isRetrying, 
    checkAuth
  } = useAuthVerification();

  // Improved auto-retry function
  useEffect(() => {
    if (authCheckFailed && autoRetryCount.current < 2) {
      console.log(`Auto-retry authentication attempt ${autoRetryCount.current + 1}`);
      const timer = setTimeout(() => {
        checkAuth(true);
        autoRetryCount.current += 1;
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [authCheckFailed, checkAuth]);

  // Handle clean login function
  const handleCleanLogin = useCallback(() => {
    if (redirectInProgress.current) return;
    
    redirectInProgress.current = true;
    console.log("Clean logout initiated");
    
    Promise.resolve(forceSignOut())
      .then(() => {
        console.log("Redirecting to login page");
        // Small delay to allow logout to complete
        setTimeout(() => {
          navigate('/login', { replace: true });
          redirectInProgress.current = false;
        }, 300);
      })
      .catch((error) => {
        console.error("Error during clean logout:", error);
        setTimeout(() => {
          navigate('/login', { replace: true });
          redirectInProgress.current = false;
        }, 300);
      });
  }, [navigate]);

  // Mark initial check as complete when we get a definitive answer
  useEffect(() => {
    if (isAuthenticated !== null && !initialCheckComplete.current) {
      initialCheckComplete.current = true;
      console.log("Initial auth check complete, authenticated:", isAuthenticated);
    }
  }, [isAuthenticated]);

  // Show recovery screen if auth check failed
  if (authCheckFailed) {
    return (
      <AuthRecoveryScreen 
        isRetrying={isRetrying}
        onRetry={() => checkAuth(true)}
        onCleanLogin={handleCleanLogin}
      />
    );
  }
  
  // Show loading screen while checking auth
  if (isAuthenticated === null) {
    return <AuthLoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      toast({
        title: "Accès refusé",
        description: "Vous devez être connecté pour accéder à cette page.",
        variant: "destructive"
      });
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, show protected content
  console.log("Authentication confirmed, rendering protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
