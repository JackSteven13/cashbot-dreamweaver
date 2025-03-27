
import { useCallback, useRef, useState } from 'react';
import { refreshSession, verifyAuth } from "@/utils/auth/index";

interface UseAuthRetryOptions {
  maxRetries?: number;
  isMounted: React.RefObject<boolean>;
}

export const useAuthRetry = ({ 
  maxRetries = 3,
  isMounted
}: UseAuthRetryOptions) => {
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const authCheckInProgress = useRef(false);
  
  const performAuthCheck = useCallback(async (isManualRetry = false): Promise<boolean> => {
    // Avoid simultaneous checks
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return false;
    }
    
    try {
      authCheckInProgress.current = true;
      
      if (isManualRetry) {
        setIsRetrying(true);
      }
      
      console.log(`Auth verification ${isManualRetry ? "manual" : "automatic"} (attempt ${retryAttempts + 1})`);
      
      // Try refreshing the session first for better persistence
      if (retryAttempts > 0 || isManualRetry) {
        console.log("Trying to refresh session before auth check");
        await refreshSession();
        
        // Small delay to allow refresh to propagate
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Verification with improved persistence
      const isAuthValid = await verifyAuth();
      
      if (!isMounted.current) {
        authCheckInProgress.current = false;
        return false;
      }
      
      if (!isAuthValid) {
        console.log("Authentication failed");
        
        if (retryAttempts < maxRetries && !isManualRetry) {
          // Auto-retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(1.5, retryAttempts), 5000);
          console.log(`Automatic retry in ${delay}ms`);
          
          setRetryAttempts(prev => prev + 1);
          authCheckInProgress.current = false;
          
          setTimeout(() => {
            if (isMounted.current) {
              performAuthCheck();
            }
          }, delay);
          return false;
        }
        
        setIsRetrying(false);
        authCheckInProgress.current = false;
        return false;
      }
      
      // Auth check successful
      console.log("Auth check successful");
      setRetryAttempts(0); // Reset retry counter on success
      setIsRetrying(false);
      authCheckInProgress.current = false;
      return true;
      
    } catch (error) {
      console.error("Error during authentication check:", error);
      
      if (retryAttempts < maxRetries && !isManualRetry && isMounted.current) {
        // Auto-retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(1.5, retryAttempts), 5000);
        console.log(`Retry after error in ${delay}ms`);
        
        setRetryAttempts(prev => prev + 1);
        authCheckInProgress.current = false;
        
        setTimeout(() => {
          if (isMounted.current) {
            performAuthCheck();
          }
        }, delay);
        return false;
      }
      
      if (isMounted.current) {
        setIsRetrying(false);
      }
      
      authCheckInProgress.current = false;
      return false;
    }
  }, [retryAttempts, maxRetries, isMounted]);

  return {
    retryAttempts,
    isRetrying,
    setIsRetrying,
    performAuthCheck
  };
};

export default useAuthRetry;
