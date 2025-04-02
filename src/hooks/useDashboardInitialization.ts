
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
  const authCheckAttempted = useRef(false);
  const initializationRetries = useRef(0);
  const maxInitRetries = 3;
  
  // Fonction améliorée pour vérifier l'authentification avec stabilité accrue
  const checkAuth = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return false;
    }
    
    try {
      authCheckInProgress.current = true;
      authCheckAttempted.current = true;
      
      console.log("Dashboard initializing: checking auth state");
      
      // Essayer de rafraîchir la session avant tout pour une meilleure résilience
      await refreshSession();
      
      // Petit délai pour permettre au rafraîchissement de se propager
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isAuthenticated = await verifyAuth();
      
      if (!mountedRef.current) {
        console.log("Component unmounted during auth check");
        authCheckInProgress.current = false;
        return false;
      }
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
        setAuthError(true);
        authCheckInProgress.current = false;
        return false;
      }
      
      console.log("Active session found, continuing dashboard initialization");
      authCheckInProgress.current = false;
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      if (mountedRef.current) {
        setAuthError(true);
      }
      authCheckInProgress.current = false;
      return false;
    }
  }, []);
  
  // Fonction pour synchroniser les données entre Supabase et le localStorage
  const syncUserData = useCallback(async () => {
    if (!mountedRef.current) return false;
    
    try {
      console.log("Syncing user data after authentication");
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session, skipping sync");
        return false;
      }
      
      // Attendre un peu pour être sûr que la session est bien établie
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { data: userBalanceData, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching subscription data:", error);
        return false;
      }
      
      if (!userBalanceData) {
        console.log("No user balance data found, may be a new user");
        return false;
      }
      
      // Mettre à jour le localStorage si nécessaire
      const localSubscription = localStorage.getItem('subscription');
      
      if (localSubscription !== userBalanceData.subscription) {
        console.log(`Syncing subscription: ${localSubscription} -> ${userBalanceData.subscription}`);
        localStorage.setItem('subscription', userBalanceData.subscription);
      }
      
      // Vérifier si une actualisation forcée a été demandée
      const forceRefresh = localStorage.getItem('forceRefreshBalance');
      if (forceRefresh === 'true') {
        console.log("Force refresh detected, clearing flag");
        localStorage.removeItem('forceRefreshBalance');
        return true; 
      }
      
      return true;
    } catch (error) {
      console.error("Error syncing user data:", error);
      return false;
    }
  }, []);
  
  useEffect(() => {
    mountedRef.current = true;
    authCheckInProgress.current = false;
    
    const initDashboard = async () => {
      if (authCheckAttempted.current) {
        console.log("Auth check already attempted, skipping duplicate initialization");
        return;
      }
      
      setIsAuthChecking(true);
      
      try {
        console.log("Starting dashboard initialization");
        const isAuthenticated = await checkAuth();
        
        if (!mountedRef.current) {
          console.log("Component unmounted during initialization");
          return;
        }
        
        if (isAuthenticated) {
          console.log("User authenticated, syncing data");
          
          // Synchroniser les données utilisateur
          const syncSuccess = await syncUserData();
          
          if (!mountedRef.current) return;
          
          if (!syncSuccess && initializationRetries.current < maxInitRetries) {
            // Retry with exponential backoff
            initializationRetries.current++;
            const retryDelay = Math.min(1000 * Math.pow(2, initializationRetries.current), 8000);
            
            console.log(`Data sync failed, retrying in ${retryDelay}ms (${initializationRetries.current}/${maxInitRetries})`);
            
            initTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                initDashboard();
              }
            }, retryDelay);
            
            return;
          }
          
          setIsAuthChecking(false);
          
          // Délai court pour éviter les problèmes de rendu
          initTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log("Dashboard ready");
              setIsReady(true);
            }
          }, 700);
        } else {
          // Redirection vers la page de login avec un délai pour éviter les problèmes
          console.log("Authentication failed, redirecting to login");
          if (mountedRef.current) {
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
        }
      }
    };
    
    console.log("Dashboard initialization started");
    // Démarrer avec un léger délai pour éviter les conflits d'initialisation
    setTimeout(() => {
      if (mountedRef.current) {
        initDashboard();
      }
    }, 500);
    
    // Set up auth state listener with improved resilience
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      
      console.log(`Auth state change: ${event}`);
      
      if (event === 'SIGNED_OUT') {
        console.log("User signed out, redirecting to login");
        navigate('/login', { replace: true });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
        // Pas besoin de réinitialiser ici, juste reconnaître le rafraîchissement
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
  }, [checkAuth, navigate, syncUserData]);

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
