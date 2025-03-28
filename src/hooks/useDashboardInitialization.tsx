
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';
import { useAuthStateListener } from './dashboard/useAuthStateListener';
import { useUserDataRefresh } from './session/useUserDataRefresh';
import { verifyAuth } from '@/utils/auth/verificationUtils';

export const useDashboardInitialization = () => {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const mountedRef = useRef(true);
  const authCheckAttemptRef = useRef(0);
  const maxAuthCheckAttempts = 3;
  
  const { refreshUserData } = useUserDataRefresh();
  const { setupAuthListener } = useAuthStateListener();
  
  // Check auth function with retry logic
  const checkAuth = useCallback(async () => {
    try {
      console.log(`useDashboardInitialization: Auth check (attempt ${authCheckAttemptRef.current + 1}/${maxAuthCheckAttempts})`);
      
      // Verify authentication
      const isAuthenticated = await verifyAuth();
      
      if (isAuthenticated) {
        console.log("useDashboardInitialization: Authentication successful");
        return true;
      } else {
        console.log("useDashboardInitialization: Authentication failed");
        return false;
      }
    } catch (error) {
      console.error("useDashboardInitialization: Error during auth check:", error);
      return false;
    }
  }, []);

  // Sync user data
  const syncUserData = useCallback(async () => {
    try {
      await refreshUserData();
      return true;
    } catch (error) {
      console.error("useDashboardInitialization: Error syncing user data:", error);
      return false;
    }
  }, [refreshUserData]);
  
  // Main initialization effect
  useEffect(() => {
    console.log("useDashboardInitialization: Mount effect running");
    mountedRef.current = true;
    authCheckAttemptRef.current = 0;
    
    const initDashboard = async () => {
      if (!mountedRef.current) return;
      
      setIsAuthChecking(true);
      setAuthError(false);
      
      try {
        // Try auth check with limited retries
        let isAuthenticated = false;
        
        while (authCheckAttemptRef.current < maxAuthCheckAttempts && !isAuthenticated) {
          isAuthenticated = await checkAuth();
          
          if (!mountedRef.current) return;
          
          if (!isAuthenticated) {
            authCheckAttemptRef.current++;
            if (authCheckAttemptRef.current < maxAuthCheckAttempts) {
              console.log(`useDashboardInitialization: Retrying (${authCheckAttemptRef.current}/${maxAuthCheckAttempts})...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (isAuthenticated) {
          console.log("useDashboardInitialization: User authenticated, initializing dashboard");
          
          // Sync user data
          await syncUserData();
          
          if (!mountedRef.current) return;
          
          setIsAuthChecking(false);
          setIsReady(true);
        } else {
          console.log("useDashboardInitialization: Authentication failed after retries, redirecting to login");
          
          if (mountedRef.current) {
            setIsAuthChecking(false);
            
            // Display error toast
            toast({
              title: "Authentication nécessaire",
              description: "Veuillez vous connecter pour accéder au tableau de bord",
              variant: "destructive",
            });
            
            // Redirect to login
            setTimeout(() => {
              if (mountedRef.current) {
                navigate('/login', { replace: true });
              }
            }, 500);
          }
        }
      } catch (err) {
        console.error("useDashboardInitialization: Error during initialization:", err);
        
        if (mountedRef.current) {
          setAuthError(true);
          setIsAuthChecking(false);
          
          toast({
            title: "Erreur de chargement",
            description: "Une erreur est survenue lors du chargement du tableau de bord",
            variant: "destructive",
          });
        }
      }
    };
    
    console.log("useDashboardInitialization: Starting dashboard initialization");
    
    // Set up auth state listener
    const subscription = setupAuthListener();
    
    // Start initialization with a delay to allow auth state to stabilize
    setTimeout(() => {
      if (mountedRef.current) {
        initDashboard();
      }
    }, 800);
    
    // Force ready state after timeout as fallback
    const forceReadyTimeout = setTimeout(() => {
      if (mountedRef.current && isAuthChecking) {
        console.log("useDashboardInitialization: Forcing dashboard ready state after timeout");
        setIsAuthChecking(false);
        setIsReady(true);
      }
    }, 10000);
    
    return () => { 
      console.log("useDashboardInitialization: Cleanup");
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(forceReadyTimeout);
    };
  }, [checkAuth, navigate, syncUserData, setupAuthListener, isAuthChecking]);

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
