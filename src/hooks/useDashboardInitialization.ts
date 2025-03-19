
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
  
  // Amélioré pour être plus robuste
  const checkAuth = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return false;
    }
    
    try {
      authCheckInProgress.current = true;
      authCheckAttempted.current = true;
      
      // Essayer de rafraîchir la session avant tout
      await refreshSession();
      
      // Petit délai pour permettre au rafraîchissement de se propager
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const isAuthenticated = await verifyAuth();
      
      if (!mountedRef.current) {
        authCheckInProgress.current = false;
        return false;
      }
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
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
        setAuthError(true);
      }
      authCheckInProgress.current = false;
      return false;
    }
  }, []);
  
  // Synchronisation des données de l'utilisateur entre Supabase et localStorage
  const syncUserData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const { data: userBalanceData, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
      
      if (error || !userBalanceData) {
        console.error("Error fetching subscription data:", error);
        return;
      }
      
      // Mettre à jour le localStorage si nécessaire
      const localSubscription = localStorage.getItem('subscription');
      
      if (localSubscription !== userBalanceData.subscription) {
        console.log("Syncing subscription:", localSubscription, "->", userBalanceData.subscription);
        localStorage.setItem('subscription', userBalanceData.subscription);
      }
      
      // Vérifier si une actualisation forcée a été demandée (par exemple après un paiement réussi)
      const forceRefresh = localStorage.getItem('forceRefreshBalance');
      if (forceRefresh === 'true') {
        console.log("Force refresh detected, clearing flag");
        localStorage.removeItem('forceRefreshBalance');
        // Informer que l'actualisation a été effectuée (à utiliser par d'autres hooks si besoin)
        return true; 
      }
      
      return false;
    } catch (error) {
      console.error("Error syncing user data:", error);
      return false;
    }
  }, []);
  
  useEffect(() => {
    mountedRef.current = true;
    
    const initDashboard = async () => {
      if (authCheckAttempted.current) {
        console.log("Auth check already attempted, skipping duplicate initialization");
        return;
      }
      
      setIsAuthChecking(true);
      try {
        const isAuthenticated = await checkAuth();
        
        if (!mountedRef.current) return;
        
        if (isAuthenticated) {
          console.log("User authenticated, initializing dashboard");
          
          // Synchroniser les données utilisateur
          await syncUserData();
          
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
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Auth state change: token refreshed");
        // No need to reinitialize here, just acknowledge the refresh
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
