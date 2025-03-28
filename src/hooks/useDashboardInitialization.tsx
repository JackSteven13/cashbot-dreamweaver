
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
  
  // Simplified auth check function with retry logic
  const checkAuth = useCallback(async () => {
    try {
      console.log(`Performing auth check (attempt ${authCheckAttemptRef.current + 1}/${maxAuthCheckAttempts})`);
      
      return await verifyAuth();
    } catch (error) {
      console.error("Error during auth check:", error);
      return false;
    }
  }, []);

  // Sync user data (simple wrapper that doesn't do much)
  const syncUserData = useCallback(async () => {
    try {
      await refreshUserData();
      return true;
    } catch (error) {
      console.error("Error syncing user data:", error);
      return false;
    }
  }, [refreshUserData]);
  
  // Main initialization effect
  useEffect(() => {
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
              console.log(`Auth check failed, retrying (${authCheckAttemptRef.current}/${maxAuthCheckAttempts})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
            }
          }
        }
        
        if (isAuthenticated) {
          console.log("User authenticated, initializing dashboard");
          
          // Sync user data
          await syncUserData();
          
          if (!mountedRef.current) return;
          
          setIsAuthChecking(false);
          setIsReady(true);
        } else {
          console.log("Authentication failed after retries, redirecting to login");
          
          if (mountedRef.current) {
            setIsAuthChecking(false);
            setAuthError(false); // Not really an error, just not authenticated
            
            toast({
              title: "Authentification nécessaire",
              description: "Veuillez vous connecter pour accéder au tableau de bord",
              variant: "destructive",
            });
            
            // Redirect to login after a short delay
            setTimeout(() => {
              if (mountedRef.current) {
                navigate('/login', { replace: true });
              }
            }, 500);
          }
        }
      } catch (err) {
        console.error("Error during dashboard initialization:", err);
        
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
    
    console.log("Dashboard initialization started");
    
    // Set up auth state listener
    const subscription = setupAuthListener();
    
    // Start initialization with a slightly longer delay to avoid race conditions
    setTimeout(() => {
      if (mountedRef.current) {
        initDashboard();
      }
    }, 800);
    
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
      subscription.unsubscribe();
      clearTimeout(forceReadyTimeout);
    };
  }, [checkAuth, navigate, syncUserData, isReady, setupAuthListener]);

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
