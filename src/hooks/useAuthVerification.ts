
import { useEffect, useRef } from 'react';
import useAuthState from './auth/useAuthState';
import useProfileFetcher from './auth/useProfileFetcher';
import useAuthChecker from './auth/useAuthChecker';

interface UseAuthVerificationResult {
  isAuthenticated: boolean | null;
  username: string | null;
  authCheckFailed: boolean;
  isRetrying: boolean;
  retryAttempts: number;
  checkAuth: (isManualRetry?: boolean) => Promise<void>;
}

export const useAuthVerification = (): UseAuthVerificationResult => {
  // Component lifecycle ref
  const isMounted = useRef(true);
  
  // Custom hooks for auth functionality
  const {
    isAuthenticated,
    authCheckFailed,
    isRetrying,
    retryAttempts,
    setIsAuthenticated,
    setAuthCheckFailed,
    setIsRetrying,
    incrementRetryAttempts
  } = useAuthState();
  
  const { username, fetchProfileData } = useProfileFetcher();
  
  const { checkAuth } = useAuthChecker({
    isMounted,
    fetchProfileData,
    setIsAuthenticated,
    setAuthCheckFailed,
    setIsRetrying,
    incrementRetryAttempts
  });
  
  // Reference for completed checks
  const authCheckCompleted = useRef(false);

  // Initial auth check effect
  useEffect(() => {
    // Reset lifecycle flags
    isMounted.current = true;
    
    console.log("useAuthVerification hook mounted");
    
    // Only check once on mount
    if (!authCheckCompleted.current) {
      // Small delay to avoid initialization conflicts
      const initTimeout = setTimeout(() => {
        if (isMounted.current) {
          checkAuth();
        }
      }, 100);
      
      return () => clearTimeout(initTimeout);
    }
    
    return () => {
      console.log("useAuthVerification hook unmounted");
      isMounted.current = false;
    };
  }, [checkAuth]);

  return {
    isAuthenticated,
    username,
    authCheckFailed,
    isRetrying,
    retryAttempts,
    checkAuth
  };
};

export default useAuthVerification;
