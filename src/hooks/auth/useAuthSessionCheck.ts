
import { useState, useCallback, useRef } from 'react';
import { verifyAuth, refreshSession } from "@/utils/auth/index";

export interface UseAuthSessionCheckOptions {
  maxRetries?: number;
}

export const useAuthSessionCheck = ({ maxRetries = 3 }: UseAuthSessionCheckOptions = {}) => {
  const [authError, setAuthError] = useState(false);
  const authCheckInProgress = useRef(false);
  const initAttempts = useRef(0);
  const mountedRef = useRef(true);
  
  // Improved to be more robust and handle failures
  const checkAuth = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return false;
    }
    
    try {
      authCheckInProgress.current = true;
      
      // Try to refresh the session first
      const refreshed = await refreshSession();
      
      if (refreshed) {
        console.log("Session refreshed successfully before auth check");
      } else {
        console.log("Session refresh failed or wasn't needed, continuing with verification");
      }
      
      // Short delay to allow the refresh to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isAuthenticated = await verifyAuth();
      
      if (!mountedRef.current) {
        authCheckInProgress.current = false;
        return false;
      }
      
      if (!isAuthenticated) {
        console.log("No active session found, will redirect to login");
        
        if (initAttempts.current < maxRetries) {
          console.log(`Retry attempt ${initAttempts.current + 1}/${maxRetries}`);
          initAttempts.current++;
          authCheckInProgress.current = false;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await checkAuth();
        }
        
        setAuthError(true);
        authCheckInProgress.current = false;
        return false;
      }
      
      console.log("Active session found, initializing dashboard");
      authCheckInProgress.current = false;
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      if (mountedRef.current) {
        if (initAttempts.current < maxRetries) {
          console.log(`Retry attempt ${initAttempts.current + 1}/${maxRetries} after error`);
          initAttempts.current++;
          authCheckInProgress.current = false;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await checkAuth();
        }
        
        setAuthError(true);
      }
      authCheckInProgress.current = false;
      return false;
    }
  }, [maxRetries]);

  const resetAuthCheck = useCallback(() => {
    initAttempts.current = 0;
    setAuthError(false);
  }, []);

  const cleanup = useCallback(() => {
    mountedRef.current = false;
  }, []);

  return {
    authError,
    setAuthError,
    checkAuth,
    resetAuthCheck,
    cleanup,
    mountedRef
  };
};
