
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { verifyAuth, refreshSession } from "@/utils/auth/index";

export const useDashboardInitialization = () => {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckInProgress = useRef(false);
  
  // Amélioré pour être plus robuste
  const checkAuth = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return false;
    }
    
    try {
      authCheckInProgress.current = true;
      
      // Essayer de rafraîchir la session avant tout
      await refreshSession();
      
      // Petit délai pour permettre au rafraîchissement de se propager
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const isAuthenticated = await verifyAuth();
      
      authCheckInProgress.current = false;
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
        setAuthError(true);
        return false;
      }
      
      console.log("Active session found, initializing dashboard");
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(true);
      authCheckInProgress.current = false;
      return false;
    }
  }, []);
  
  useEffect(() => {
    mountedRef.current = true;
    
    const initDashboard = async () => {
      setIsAuthChecking(true);
      try {
        const isAuthenticated = await checkAuth();
        
        if (!mountedRef.current) return;
        
        if (isAuthenticated) {
          console.log("User authenticated, initializing dashboard");
          setIsAuthChecking(false);
          
          // Délai court pour éviter les problèmes de rendu
          initTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log("Dashboard ready");
              setIsReady(true);
            }
          }, 500);
        } else {
          // Redirection vers la page de login avec un délai pour éviter les problèmes
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
    // Démarrer avec un léger délai pour éviter les conflits d'initialisation
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
      }
    });
    
    return () => { 
      console.log("Dashboard initialization cleanup");
      mountedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [checkAuth, navigate]);

  return {
    isAuthChecking,
    isReady,
    authError,
    setAuthError,
    setIsAuthChecking
  };
};

export default useDashboardInitialization;
