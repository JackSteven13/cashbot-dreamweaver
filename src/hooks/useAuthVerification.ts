
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
  const checkInProgress = useRef(false);
  
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
    if (checkInProgress.current) {
      console.log("Auth check already in progress, skipping duplicated call");
      return;
    }
    
    checkInProgress.current = true;
    
    if (isManualRetry) {
      setIsRetrying(true);
      setAuthCheckFailed(false);
      setIsAuthenticated(null);
    }
    
    const isAuthValid = await performAuthCheck(isManualRetry);
    
    if (!isMounted.current) {
      checkInProgress.current = false;
      return;
    }
    
    if (!isAuthValid) {
      setAuthCheckFailed(true);
      setIsAuthenticated(false);
      checkInProgress.current = false;
      return;
    }
    
    try {
      // Get user data for welcome message with improved error handling
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Error fetching user:", error);
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        checkInProgress.current = false;
        return;
      }
      
      const user = data.user;
      
      if (!user) {
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        checkInProgress.current = false;
        return;
      }
      
      // Fetch profile data for username with improved error handling
      await fetchProfileData(user.id);
      
      if (isMounted.current) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Error during auth check:", err);
      if (isMounted.current) {
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
      }
    } finally {
      checkInProgress.current = false;
    }
  }, [performAuthCheck, fetchProfileData, setIsRetrying]);

  // Handle auth state changes with improved stability
  useAuthStateListener({
    onSignOut: () => {
      if (isMounted.current) {
        setIsAuthenticated(false);
        setUsername(null);
      }
    },
    onTokenRefresh: () => {
      if (isMounted.current) {
        console.log("Token refreshed successfully");
        setIsAuthenticated(true);
      }
    },
    isMounted
  });

  useEffect(() => {
    isMounted.current = true;
    checkInProgress.current = false;
    
    // Set timeout for initial auth check with longer delay to ensure proper initialization
    const initTimeout = setTimeout(() => {
      if (isMounted.current && !checkInProgress.current) {
        checkAuth();
      }
    }, 1000);
    
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
