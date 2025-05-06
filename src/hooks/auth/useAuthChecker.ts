
import { useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { refreshSession } from "@/utils/auth/index";

interface UseAuthCheckerProps {
  isMounted: React.MutableRefObject<boolean>;
  fetchProfileData: (userId: string) => Promise<void>;
  setIsAuthenticated: (value: boolean | null) => void;
  setAuthCheckFailed: (value: boolean) => void;
  setIsRetrying: (value: boolean) => void;
  incrementRetryAttempts: () => void;
}

interface UseAuthCheckerResult {
  checkAuth: (isManualRetry?: boolean) => Promise<void>;
}

export const useAuthChecker = ({
  isMounted,
  fetchProfileData,
  setIsAuthenticated,
  setAuthCheckFailed,
  setIsRetrying,
  incrementRetryAttempts
}: UseAuthCheckerProps): UseAuthCheckerResult => {
  // References for safety checks
  const checkInProgress = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check authentication status
  const checkAuth = useCallback(async (isManualRetry = false) => {
    // Avoid concurrent executions
    if (checkInProgress.current || !isMounted.current) {
      console.log("Authentication check already in progress or component unmounted");
      return;
    }
    
    // Clean up local flags
    localStorage.removeItem('auth_redirecting');
    localStorage.removeItem('auth_redirect_timestamp');
    
    checkInProgress.current = true;
    
    if (isManualRetry) {
      setIsRetrying(true);
      setAuthCheckFailed(false);
      setIsAuthenticated(null);
    }
    
    console.log("Authentication check started");
    
    // Set safety timeout
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
    }
    
    authTimeoutRef.current = setTimeout(() => {
      if (checkInProgress.current && isMounted.current) {
        console.log("Auth check timeout reached, forcing failure");
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        checkInProgress.current = false;
      }
    }, 5000); // 5 second safety timeout
    
    try {
      // Check for local token first
      const hasLocalToken = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      
      if (!hasLocalToken) {
        if (isMounted.current) {
          setIsAuthenticated(false);
          setAuthCheckFailed(false);
        }
        
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      // Try refreshing session first
      await refreshSession();
      
      // Brief delay to allow session propagation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get active session
      const { data, error } = await supabase.auth.getSession();
      
      if (!isMounted.current) {
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      if (error || !data.session) {
        console.error("Error or no session:", error);
        
        if (isMounted.current) {
          setAuthCheckFailed(true);
          setIsAuthenticated(false);
          incrementRetryAttempts();
        }
        
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      // Valid session found
      if (data.session && data.session.user) {
        if (isMounted.current) {
          setIsAuthenticated(true);
          setAuthCheckFailed(false);
          fetchProfileData(data.session.user.id);
        }
      } else {
        if (isMounted.current) {
          setIsAuthenticated(false);
          setAuthCheckFailed(false);
        }
      }
    } catch (err) {
      console.error("Error during authentication check:", err);
      
      if (isMounted.current) {
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
      }
    } finally {
      setIsRetrying(false);
      
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      
      checkInProgress.current = false;
    }
  }, [fetchProfileData, isMounted, setAuthCheckFailed, setIsAuthenticated, setIsRetrying, incrementRetryAttempts]);

  return { checkAuth };
};

export default useAuthChecker;
