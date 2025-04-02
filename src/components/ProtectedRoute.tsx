
import { ReactNode, useEffect, useRef, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthVerification } from '@/hooks/useAuthVerification';
import AuthLoadingScreen from './auth/AuthLoadingScreen';
import ProtectedRouteRecovery from './auth/ProtectedRouteRecovery';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const redirectInProgress = useRef(false);
  const initialCheckComplete = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadingTime = useRef<NodeJS.Timeout | null>(null);
  const autoRetryCount = useRef(0);
  const stableLocationRef = useRef(location.pathname);
  
  // Mettre à jour la référence stable pour éviter les renders en cascade
  useEffect(() => {
    stableLocationRef.current = location.pathname;
  }, [location.pathname]);
  
  // Use auth verification with no dependencies to prevent infinite loops
  const { 
    isAuthenticated, 
    authCheckFailed, 
    isRetrying, 
    checkAuth
  } = useAuthVerification();

  // Stable cleanup function with no dependencies
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (maxLoadingTime.current) {
      clearTimeout(maxLoadingTime.current);
      maxLoadingTime.current = null;
    }
  }, []);

  // Single effect for timeout management
  useEffect(() => {
    // Vérifier si une redirection est déjà en cours via localStorage
    const isAuthRedirecting = localStorage.getItem('auth_redirecting') === 'true';
    
    if (isAuthRedirecting) {
      console.log("Auth redirection in progress, skipping timeout setup");
      return clearTimeouts;
    }
    
    // Only set timeout if authentication hasn't been verified yet
    // and no timeout is already set
    if (isAuthenticated === null && !maxLoadingTime.current) {
      maxLoadingTime.current = setTimeout(() => {
        console.log("Maximum loading time reached, forcing verification");
        if (!redirectInProgress.current && isAuthenticated === null) {
          checkAuth(true);
        }
      }, 8000);
    }
    
    return clearTimeouts;
  }, [isAuthenticated, checkAuth, clearTimeouts]);

  // Effect for auto-retry with cleanup
  useEffect(() => {
    // Clear any existing retry timeout first to prevent multiple timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Vérifier si une redirection est déjà en cours via localStorage
    const isAuthRedirecting = localStorage.getItem('auth_redirecting') === 'true';
    
    if (isAuthRedirecting) {
      console.log("Auth redirection in progress, skipping retry setup");
      return;
    }
    
    if (authCheckFailed && autoRetryCount.current < 3 && !timeoutRef.current && !redirectInProgress.current) {
      console.log(`Automatic retry ${autoRetryCount.current + 1}/3`);
      
      timeoutRef.current = setTimeout(() => {
        if (!redirectInProgress.current) {
          autoRetryCount.current += 1;
          checkAuth(true);
        }
        timeoutRef.current = null;
      }, 2000);
    }
    
    if (isAuthenticated !== null && !initialCheckComplete.current) {
      initialCheckComplete.current = true;
      console.log("Initial auth check completed, result:", isAuthenticated);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [authCheckFailed, isAuthenticated, checkAuth]);

  // Clean up on unmount
  useEffect(() => {
    console.log("ProtectedRoute mounting");
    redirectInProgress.current = false;
    
    return () => {
      console.log("ProtectedRoute unmounting");
      clearTimeouts();
      
      // Clear all localStorage flags to prevent stale state
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
    };
  }, [clearTimeouts]);

  // Fonction pour rediriger vers la page de login de manière sécurisée
  const handleCleanLogin = useCallback(() => {
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      localStorage.setItem('auth_redirecting', 'true');
      
      // Nettoyer les tokens d'authentification
      localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      
      // Retirer le flag de redirection après un délai
      setTimeout(() => {
        localStorage.removeItem('auth_redirecting');
      }, 1000);
      
      window.location.href = '/login';
    }
  }, []);

  // Show recovery screen if auth check failed
  if (authCheckFailed) {
    return (
      <ProtectedRouteRecovery
        isRetrying={isRetrying}
        autoRetryCount={autoRetryCount}
        maxAutoRetries={3}
        onRetry={() => checkAuth(true)}
        onCleanLogin={handleCleanLogin}
      />
    );
  }
  
  // Show loading screen during auth verification
  if (isAuthenticated === null) {
    return <AuthLoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      localStorage.setItem('auth_redirecting', 'true');
      
      // Nettoyer le flag de redirection après un délai
      setTimeout(() => {
        localStorage.removeItem('auth_redirecting');
      }, 1000);
      
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, show protected content
  return <>{children}</>;
};

export default ProtectedRoute;
