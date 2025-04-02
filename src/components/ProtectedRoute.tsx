
import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthVerification } from '@/hooks/useAuthVerification';
import AuthLoadingScreen from './auth/AuthLoadingScreen';
import ProtectedRouteRecovery from './auth/ProtectedRouteRecovery';
import { useProtectedRouteState } from './auth/useProtectedRouteState';
import { useAuthRedirect } from './auth/useAuthRedirect';
import { useAuthTimeouts } from './auth/useAuthTimeouts';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Use the extracted hooks for state management
  const {
    isAuthenticated,
    redirectInProgress,
    initialCheckComplete,
    autoRetryCount,
    timeoutRef,
    maxLoadingTime
  } = useProtectedRouteState();
  
  const { handleCleanLogin, redirectToLogin, location } = useAuthRedirect();
  
  // Get auth verification hooks
  const { 
    isAuthenticated: authStatus, 
    authCheckFailed, 
    isRetrying, 
    checkAuth
  } = useAuthVerification();

  // Setup timeouts
  useAuthTimeouts({
    timeoutRef,
    maxLoadingTime,
    initialCheckComplete,
    isAuthenticated: authStatus,
    redirectInProgress,
    handleCleanLogin,
    checkAuth
  });

  // Update local state based on auth status
  useEffect(() => {
    if (authStatus !== null && !initialCheckComplete.current) {
      initialCheckComplete.current = true;
      console.log("Initial auth check complete, result:", authStatus);
    }
  }, [authStatus]);

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
  
  // Show loading screen while checking auth
  if (authStatus === null) {
    return <AuthLoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (authStatus === false) {
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      return redirectToLogin();
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, show protected content
  return <>{children}</>;
};

export default ProtectedRoute;
