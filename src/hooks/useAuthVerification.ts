
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
  const initialCheckComplete = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { username, setUsername, fetchProfileData } = useProfileData();
  
  const { 
    retryAttempts, 
    isRetrying, 
    setIsRetrying,
    performAuthCheck 
  } = useAuthRetry({ 
    isMounted,
    maxRetries: 5
  });

  // Fonction améliorée avec timeout de sécurité
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
    
    console.log("Starting auth verification check");
    
    // Mise en place d'un timeout de sécurité pour éviter les blocages infinis
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
    }, 15000); // 15 secondes de timeout maximal
    
    try {
      const isAuthValid = await performAuthCheck(isManualRetry);
      
      if (!isMounted.current) {
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        checkInProgress.current = false;
        return;
      }
      
      if (!isAuthValid) {
        console.log("Auth check failed, update state accordingly");
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      // Get user data for welcome message with improved error handling
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Error fetching user:", error);
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      const user = data.user;
      
      if (!user) {
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      // Fetch profile data for username with improved error handling
      await fetchProfileData(user.id);
      
      if (isMounted.current) {
        console.log("Auth check successful, user is authenticated");
        setIsAuthenticated(true);
        initialCheckComplete.current = true;
      }
    } catch (err) {
      console.error("Error during auth check:", err);
      if (isMounted.current) {
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
      }
    } finally {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      checkInProgress.current = false;
    }
  }, [performAuthCheck, fetchProfileData, setIsRetrying]);

  // Handle auth state changes with improved stability
  useAuthStateListener({
    onSignOut: () => {
      if (isMounted.current) {
        console.log("User signed out, updating state");
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
    initialCheckComplete.current = false;
    
    console.log("Initial auth check starting with stable delay");
    
    // Set timeout for initial auth check with longer delay to ensure proper initialization
    const initTimeout = setTimeout(() => {
      if (isMounted.current && !checkInProgress.current) {
        checkAuth();
      }
    }, 1500);
    
    return () => {
      console.log("useAuthVerification hook unmounting");
      isMounted.current = false;
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
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
