
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { refreshSession, verifyAuth } from "@/utils/auth/index";
import { useUserDataRefresh } from './session/useUserDataRefresh';

export const useDashboardInitialization = () => {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckInProgress = useRef(false);
  const initAttempts = useRef(0);
  const maxInitAttempts = 3;
  
  const { refreshUserData } = useUserDataRefresh();
  
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
        
        if (initAttempts.current < maxInitAttempts) {
          console.log(`Retry attempt ${initAttempts.current + 1}/${maxInitAttempts}`);
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
        if (initAttempts.current < maxInitAttempts) {
          console.log(`Retry attempt ${initAttempts.current + 1}/${maxInitAttempts} after error`);
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
  }, []);
  
  // Function to sync user data - adding this to fix the missing property
  const syncUserData = useCallback(async () => {
    try {
      if (!mountedRef.current) return false;
      
      console.log("Syncing user data in background");
      const result = await refreshUserData();
      return result;
    } catch (error) {
      console.error("Error syncing user data:", error);
      return false;
    }
  }, [refreshUserData]);
  
  useEffect(() => {
    mountedRef.current = true;
    initAttempts.current = 0;
    
    const initDashboard = async () => {
      setIsAuthChecking(true);
      try {
        const isAuthenticated = await checkAuth();
        
        if (!mountedRef.current) return;
        
        if (isAuthenticated) {
          console.log("User authenticated, initializing dashboard");
          
          // Sync user data in background
          setTimeout(async () => {
            if (mountedRef.current) {
              await refreshUserData().catch(err => {
                console.warn("Background sync failed:", err);
              });
            }
          }, 1000);
          
          setIsAuthChecking(false);
          
          // Force setting ready state after a delay
          initTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log("Dashboard ready (forced)");
              setIsReady(true);
            }
          }, 2000);
        } else {
          console.log("Authentication failed, redirecting to login");
          if (mountedRef.current) {
            setIsAuthChecking(false);
            
            setTimeout(() => {
              if (mountedRef.current) {
                navigate('/login', { replace: true });
              }
            }, 400);
          }
        }
      } catch (err) {
        console.error("Error during dashboard initialization:", err);
        if (mountedRef.current) {
          setAuthError(true);
          setIsAuthChecking(false);
        }
      }
    };
    
    console.log("Dashboard initialization started");
    // Start with slight delay to avoid initialization conflicts
    setTimeout(() => {
      if (mountedRef.current) {
        initDashboard();
      }
    }, 300);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mountedRef.current) return;
      
      if (event === 'SIGNED_OUT') {
        console.log("Auth state change: signed out");
        navigate('/login', { replace: true });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Auth state change: token refreshed");
        // No need to reinitialize here, just acknowledge the refresh
      }
    });
    
    // Force ready state after timeout as fallback
    const forceReadyTimeout = setTimeout(() => {
      if (mountedRef.current && !isReady) {
        console.log("Forcing dashboard ready state after timeout");
        setIsAuthChecking(false);
        setIsReady(true);
      }
    }, 10000);
    
    return () => { 
      console.log("Dashboard initialization cleanup");
      mountedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      clearTimeout(forceReadyTimeout);
      subscription.unsubscribe();
    };
  }, [checkAuth, navigate, refreshUserData, isReady]);

  return {
    isAuthChecking,
    isReady,
    authError,
    setAuthError,
    setIsAuthChecking,
    syncUserData  // Explicitly adding this to the returned object
  };
};

export default useDashboardInitialization;
