
import { useEffect, useCallback } from 'react';

interface UseAuthTimeoutsProps {
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  maxLoadingTime: React.MutableRefObject<NodeJS.Timeout | null>;
  initialCheckComplete: React.MutableRefObject<boolean>;
  isAuthenticated: boolean | null;
  redirectInProgress: React.MutableRefObject<boolean>;
  handleCleanLogin: () => void;
  checkAuth: (isManualRetry?: boolean) => void;
}

/**
 * Hook to manage authentication timeouts
 */
export const useAuthTimeouts = ({
  timeoutRef,
  maxLoadingTime,
  initialCheckComplete,
  isAuthenticated,
  redirectInProgress,
  handleCleanLogin,
  checkAuth
}: UseAuthTimeoutsProps) => {
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (maxLoadingTime.current) {
      clearTimeout(maxLoadingTime.current);
      maxLoadingTime.current = null;
    }
  }, [timeoutRef, maxLoadingTime]);

  useEffect(() => {
    const timeoutDuration = 15000; // 15 seconds maximum waiting time
    
    if (isAuthenticated === null) {
      console.log("Setting max loading time protection");
      
      maxLoadingTime.current = setTimeout(() => {
        if (!initialCheckComplete.current && isAuthenticated === null) {
          console.log("Auth check maximum time reached, forcing redirect to login");
          if (!redirectInProgress.current) {
            redirectInProgress.current = true;
            handleCleanLogin();
          }
        }
      }, timeoutDuration);
      
      timeoutRef.current = setTimeout(() => {
        if (!initialCheckComplete.current && isAuthenticated === null) {
          console.log("Auth check timeout reached, forcing retry");
          checkAuth(true);
        }
      }, 5000);
    }

    return clearTimeouts;
  }, [
    isAuthenticated, 
    maxLoadingTime, 
    timeoutRef, 
    initialCheckComplete, 
    redirectInProgress, 
    handleCleanLogin, 
    checkAuth,
    clearTimeouts
  ]);

  return { clearTimeouts };
};
