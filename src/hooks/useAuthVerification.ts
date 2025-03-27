
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStateListener } from './auth/useAuthStateListener';
import { useAuthRetry } from './auth/useAuthRetry';
import { useProfileData } from './auth/useProfileData';
import { supabase } from "@/integrations/supabase/client";

export const useAuthVerification = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const isMounted = useRef(true);
  const initialCheckPerformed = useRef(false);
  
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
    console.log("Checking auth, isManualRetry:", isManualRetry);
    
    if (isManualRetry) {
      setIsRetrying(true);
      setAuthCheckFailed(false);
      setIsAuthenticated(null);
    }
    
    try {
      const isAuthValid = await performAuthCheck(isManualRetry);
      
      if (!isMounted.current) return;
      
      initialCheckPerformed.current = true;
      
      if (!isAuthValid) {
        console.log("Auth check failed, setting authCheckFailed to true");
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        return;
      }
      
      // Get user data for welcome message
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        console.log("No user found after auth check, setting authCheckFailed to true", error);
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        return;
      }
      
      // Fetch profile data for username
      await fetchProfileData(data.user.id);
      
      if (isMounted.current) {
        console.log("Auth check successful, setting isAuthenticated to true");
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error during auth check:", error);
      initialCheckPerformed.current = true;
      if (isMounted.current) {
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
      }
    }
  }, [performAuthCheck, fetchProfileData, setIsRetrying]);

  // Handle auth state changes
  useAuthStateListener({
    onSignOut: () => {
      console.log("Auth state change: user signed out");
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
    initialCheckPerformed.current = false;
    
    console.log("useAuthVerification hook mounting");
    
    // Set timeout for initial auth check with longer delay
    const initTimeout = setTimeout(() => {
      if (isMounted.current && !initialCheckPerformed.current) {
        console.log("Initial auth check starting after delay");
        checkAuth();
      }
    }, 500);
    
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
