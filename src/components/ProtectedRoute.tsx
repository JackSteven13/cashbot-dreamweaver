
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
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Effect to prevent infinite redirects - use a longer timeout
  useEffect(() => {
    // Set a timeout to ensure we don't wait forever
    if (!initialCheckComplete.current && isAuthenticated === null) {
      redirectTimeoutRef.current = setTimeout(() => {
        console.log("Auth check timeout reached, forcing redirect to login");
        handleCleanLogin();
      }, 30000); // 30 seconds timeout (increased from 15)
    } else if (initialCheckComplete.current || isAuthenticated !== null) {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [handleCleanLogin, isAuthenticated]);

  // Mark initial check as complete when we get a definitive answer
  useEffect(() => {
    if (isAuthenticated !== null && !initialCheckComplete.current) {
      initialCheckComplete.current = true;
      console.log("Initial auth check complete, authenticated:", isAuthenticated);
      
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
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
    console.log("User is not authenticated, redirecting to login page");
    
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
