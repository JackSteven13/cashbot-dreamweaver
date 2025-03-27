
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuthRetry } from './auth/useAuthRetry';
import { useAuthStateListener } from './auth/useAuthStateListener';
import { useUserDataRefresh } from './session/useUserDataRefresh';

export const useDashboardInitialization = () => {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckAttempted = useRef(false);
  
  const { refreshUserData } = useUserDataRefresh();
  
  const { 
    performAuthCheck
  } = useAuthRetry({ 
    isMounted: mountedRef 
  });

  // Handle auth state changes
  useAuthStateListener({
    onSignOut: () => {
      console.log("Auth state change: signed out");
      navigate('/login', { replace: true });
    },
    onTokenRefresh: () => {
      console.log("Auth state change: token refreshed");
    },
    isMounted: mountedRef
  });
  
  // Synchronize user data between Supabase and localStorage
  const syncUserData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return false;
      
      // Check if a forced refresh was requested
      const forceRefresh = localStorage.getItem('forceRefreshBalance');
      if (forceRefresh === 'true') {
        console.log("Force refresh detected, clearing flag");
        localStorage.removeItem('forceRefreshBalance');
        await refreshUserData();
        return true;
      }
      
      // Try to get subscription data
      const hasChanges = await refreshUserData();
      return hasChanges;
    } catch (error) {
      console.error("Error syncing user data:", error);
      return false;
    }
  }, [refreshUserData]);
  
  useEffect(() => {
    mountedRef.current = true;
    
    const initDashboard = async () => {
      if (authCheckAttempted.current) {
        console.log("Auth check already attempted, skipping duplicate initialization");
        return;
      }
      
      authCheckAttempted.current = true;
      setIsAuthChecking(true);
      
      try {
        // Get cached subscription for faster UI rendering
        const cachedSubscription = localStorage.getItem('subscription');
        if (cachedSubscription) {
          console.log("Using cached subscription for initial render:", cachedSubscription);
        }
        
        const isAuthenticated = await performAuthCheck();
        
        if (!mountedRef.current) return;
        
        if (isAuthenticated) {
          console.log("User authenticated, initializing dashboard");
          
          // Sync user data in background
          setTimeout(async () => {
            if (mountedRef.current) {
              await syncUserData().catch(err => {
                console.warn("Background sync failed:", err);
              });
            }
          }, 1000);
          
          setIsAuthChecking(false);
          
          // Short delay to avoid rendering issues
          initTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log("Dashboard ready");
              setIsReady(true);
            }
          }, 500);
        } else {
          console.log("Authentication failed, redirecting to login");
          if (mountedRef.current) {
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
    
    return () => { 
      console.log("Dashboard initialization cleanup");
      mountedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [navigate, performAuthCheck, syncUserData]);

  return {
    isAuthChecking,
    isReady,
    authError,
    setAuthError,
    setIsAuthChecking,
    syncUserData
  };
};

export default useDashboardInitialization;
