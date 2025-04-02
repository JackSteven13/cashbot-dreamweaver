
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    isAuthenticated, 
    authCheckFailed, 
    isRetrying, 
    checkAuth
  } = useAuthVerification();

  // Fonction pour retry automatique améliorée
  useEffect(() => {
    if (authCheckFailed && autoRetryCount.current < 2 && !redirectInProgress.current) {
      console.log(`Auto-retry authentication attempt ${autoRetryCount.current + 1}`);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        checkAuth(true);
        autoRetryCount.current += 1;
      }, 1500);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [authCheckFailed, checkAuth]);

  // Handle clean login function
  const handleCleanLogin = useCallback(() => {
    if (redirectInProgress.current) return;
    
    redirectInProgress.current = true;
    console.log("Déconnexion propre initiée");
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    Promise.resolve(forceSignOut())
      .then(() => {
        console.log("Redirection vers la page de connexion");
        // Petit délai pour permettre à la déconnexion de se terminer
        setTimeout(() => {
          navigate('/login', { replace: true });
          redirectInProgress.current = false;
        }, 300);
      })
      .catch((error) => {
        console.error("Erreur pendant la déconnexion propre:", error);
        setTimeout(() => {
          navigate('/login', { replace: true });
          redirectInProgress.current = false;
        }, 300);
      });
  }, [navigate]);

  // Effect to prevent infinite redirects
  useEffect(() => {
    // Set a timeout to ensure we don't wait forever
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!initialCheckComplete.current && isAuthenticated === null) {
        console.log("Auth check timeout reached, forcing redirect to login");
        handleCleanLogin();
      }
    }, 8000); // 8 seconds timeout

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleCleanLogin, isAuthenticated]);

  // Mark initial check as complete when we get a definitive answer
  useEffect(() => {
    if (isAuthenticated !== null && !initialCheckComplete.current) {
      initialCheckComplete.current = true;
    }
  }, [isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
  return <>{children}</>;
};

export default ProtectedRoute;
