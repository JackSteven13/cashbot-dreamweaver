
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
  const maxAutoRetries = 3;
  const maxLoadingTime = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    isAuthenticated, 
    authCheckFailed, 
    isRetrying, 
    checkAuth
  } = useAuthVerification();

  // Fonction pour retry automatique améliorée avec backoff exponentiel
  useEffect(() => {
    if (authCheckFailed && autoRetryCount.current < maxAutoRetries && !redirectInProgress.current) {
      console.log(`Auto-retry authentication attempt ${autoRetryCount.current + 1}/${maxAutoRetries}`);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Utiliser un délai exponentiel
      const retryDelay = Math.min(1000 * Math.pow(2, autoRetryCount.current), 8000);
      console.log(`Retrying in ${retryDelay}ms`);
      
      timeoutRef.current = setTimeout(() => {
        checkAuth(true);
        autoRetryCount.current += 1;
      }, retryDelay);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [authCheckFailed, checkAuth]);

  // Handle clean login function with improved stability
  const handleCleanLogin = useCallback(() => {
    if (redirectInProgress.current) {
      console.log("Redirect already in progress, skipping");
      return;
    }
    
    redirectInProgress.current = true;
    console.log("Déconnexion propre initiée");
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (maxLoadingTime.current) {
      clearTimeout(maxLoadingTime.current);
    }
    
    Promise.resolve(forceSignOut())
      .then(() => {
        console.log("Redirection vers la page de connexion");
        // Petit délai pour permettre à la déconnexion de se terminer
        setTimeout(() => {
          navigate('/login', { replace: true, state: { from: location } });
          redirectInProgress.current = false;
        }, 500);
      })
      .catch((error) => {
        console.error("Erreur pendant la déconnexion propre:", error);
        setTimeout(() => {
          navigate('/login', { replace: true, state: { from: location } });
          redirectInProgress.current = false;
        }, 500);
      });
  }, [navigate, location]);

  // Effect to prevent infinite redirects with improved timeout handling
  useEffect(() => {
    // Set a timeout to ensure we don't wait forever
    const timeoutDuration = 15000; // 15 seconds for maximum waiting time
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (maxLoadingTime.current) {
      clearTimeout(maxLoadingTime.current);
    }
    
    if (isAuthenticated === null) {
      console.log("Setting max loading time protection");
      
      maxLoadingTime.current = setTimeout(() => {
        if (!initialCheckComplete.current && isAuthenticated === null) {
          console.log("Auth check maximum time reached, forcing redirect to login");
          handleCleanLogin();
        }
      }, timeoutDuration);
      
      timeoutRef.current = setTimeout(() => {
        if (!initialCheckComplete.current && isAuthenticated === null) {
          console.log("Auth check timeout reached, forcing retry");
          checkAuth(true);
        }
      }, 5000); // Premier timeout à 5 secondes pour forcer une vérification
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxLoadingTime.current) {
        clearTimeout(maxLoadingTime.current);
      }
    };
  }, [handleCleanLogin, isAuthenticated, checkAuth]);

  // Mark initial check as complete when we get a definitive answer
  useEffect(() => {
    if (isAuthenticated !== null && !initialCheckComplete.current) {
      initialCheckComplete.current = true;
      console.log("Initial auth check complete, result:", isAuthenticated);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (maxLoadingTime.current) {
        clearTimeout(maxLoadingTime.current);
        maxLoadingTime.current = null;
      }
    }
  }, [isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("ProtectedRoute unmounting");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxLoadingTime.current) {
        clearTimeout(maxLoadingTime.current);
      }
    };
  }, []);

  // Show recovery screen if auth check failed after all auto-retries
  if (authCheckFailed && autoRetryCount.current >= maxAutoRetries) {
    return (
      <AuthRecoveryScreen 
        isRetrying={isRetrying}
        onRetry={() => {
          console.log("Manual retry requested");
          autoRetryCount.current = 0;
          checkAuth(true);
        }}
        onCleanLogin={handleCleanLogin}
      />
    );
  }
  
  // Show recovery screen if auth check failed but auto-retries are not exhausted
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
