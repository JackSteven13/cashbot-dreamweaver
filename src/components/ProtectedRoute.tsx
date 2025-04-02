
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
    // Only set timeout if authentication hasn't been verified yet
    // and no timeout is already set
    if (isAuthenticated === null && !maxLoadingTime.current) {
      maxLoadingTime.current = setTimeout(() => {
        console.log("Maximum loading time reached, forcing verification");
        checkAuth(true);
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
    
    if (authCheckFailed && autoRetryCount.current < 3 && !timeoutRef.current) {
      console.log(`Automatic retry ${autoRetryCount.current + 1}/3`);
      
      timeoutRef.current = setTimeout(() => {
        autoRetryCount.current += 1;
        checkAuth(true);
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
    return () => {
      console.log("ProtectedRoute unmounting");
      clearTimeouts();
      
      // Clear all localStorage flags to prevent stale state
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_redirecting');
    };
  }, [clearTimeouts]);

  // Show recovery screen if auth check failed
  if (authCheckFailed) {
    return (
      <ProtectedRouteRecovery
        isRetrying={isRetrying}
        autoRetryCount={autoRetryCount}
        maxAutoRetries={3}
        onRetry={() => checkAuth(true)}
        onCleanLogin={() => {
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
          localStorage.removeItem('auth_checking');
          localStorage.removeItem('auth_refreshing');
          window.location.href = '/login';
        }}
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
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, show protected content
  return <>{children}</>;
};

export default ProtectedRoute;
