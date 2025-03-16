
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStateListener } from './auth/useAuthStateListener';
import { useAuthRetry } from './auth/useAuthRetry';
import { useProfileData } from './auth/useProfileData';
import { supabase } from "@/integrations/supabase/client";

interface UseAuthVerificationResult {
  isAuthenticated: boolean | null;
  username: string | null;
  authCheckFailed: boolean;
  isRetrying: boolean;
  retryAttempts: number;
  checkAuth: (isManualRetry?: boolean) => Promise<void>;
}

export const useAuthVerification = (): UseAuthVerificationResult => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const isMounted = useRef(true);
  
  const { username, setUsername, fetchProfileData } = useProfileData();
  
  const { 
    retryAttempts, 
    isRetrying, 
    setIsRetrying,
    performAuthCheck 
  } = useAuthRetry({ 
    isMounted 
  });

  const checkAuth = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
      setAuthCheckFailed(false);
      setIsAuthenticated(null);
    }
    
    const isAuthValid = await performAuthCheck(isManualRetry);
    
    if (!isMounted.current) return;
    
    if (!isAuthValid) {
      setAuthCheckFailed(true);
      setIsAuthenticated(false);
      return;
    }
    
    // Get user data for welcome message
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    
    if (!user) {
      setAuthCheckFailed(true);
      setIsAuthenticated(false);
      return;
    }
    
    // Fetch profile data for username
    await fetchProfileData(user.id);
    
    if (isMounted.current) {
      setIsAuthenticated(true);
    }
  }, [performAuthCheck, fetchProfileData, setIsRetrying]);

  // Handle auth state changes
  useAuthStateListener({
    onSignOut: () => {
      setIsAuthenticated(false);
      setUsername(null);
    },
    onTokenRefresh: () => {
      console.log("Token refreshed successfully");
      setIsAuthenticated(true);
    },
    isMounted
  });

  useEffect(() => {
    isMounted.current = true;
    
    // Set timeout for initial auth check with longer delay
    const initTimeout = setTimeout(() => {
      if (isMounted.current) {
        checkAuth();
      }
    }, 800);
    
    return () => {
      console.log("useAuthVerification hook unmounting");
      isMounted.current = false;
      clearTimeout(initTimeout);
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
