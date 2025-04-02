
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInitializationState } from './useInitializationState';
import { useInitializationRefs } from './useInitializationRefs';
import { useRetryAttempts } from './useRetryAttempts';
import { useAuthCheck } from './useAuthCheck';
import { useUserDataSync } from './useUserDataSync';
import { useAuthStateListener } from './useAuthStateListener';
import { toast } from "@/components/ui/use-toast";

export const useDashboardInitialization = () => {
  const navigate = useNavigate();
  const { 
    isAuthChecking, setIsAuthChecking, 
    isReady, setIsReady, 
    authError, setAuthError 
  } = useInitializationState();
  
  const {
    mountedRef,
    initTimeoutRef,
    authCheckInProgress,
    authCheckAttempted
  } = useInitializationRefs();
  
  const {
    resetRetryCount,
    incrementRetryCount,
    shouldRetry,
    calculateRetryDelay
  } = useRetryAttempts(3);
  
  const { checkAuth } = useAuthCheck({ mountedRef });
  const { syncUserData } = useUserDataSync({ mountedRef });
  const { setupAuthListener } = useAuthStateListener({ mountedRef });
  
  // Improved dashboard initialization function with better state management
  const initializeDashboard = useCallback(async () => {
    // Prevent duplicate initializations
    if (authCheckAttempted.current) {
      console.log("Auth check already attempted, skipping duplicate initialization");
      return;
    }
    
    if (authCheckInProgress.current) {
      console.log("Initialization already in progress, skipping");
      return;
    }
    
    // Set a flag to prevent conflicting initialization
    if (localStorage.getItem('dashboard_initializing') === 'true') {
      console.log("Dashboard initialization already in progress from another component");
      return;
    }
    
    localStorage.setItem('dashboard_initializing', 'true');
    authCheckInProgress.current = true;
    setIsAuthChecking(true);
    
    try {
      console.log("Starting dashboard initialization");
      authCheckAttempted.current = true;
      
      // Vérifier si le token local existe
      const hasLocalToken = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      if (!hasLocalToken) {
        console.log("No local token found, redirecting to login");
        setAuthError(true);
        authCheckInProgress.current = false;
        localStorage.removeItem('dashboard_initializing');
        
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter pour accéder à votre tableau de bord",
          variant: "destructive"
        });
        
        setTimeout(() => {
          if (mountedRef.current) {
            navigate('/login', { replace: true });
          }
        }, 500);
        
        return;
      }
      
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) {
        console.log("Component unmounted during initialization");
        authCheckInProgress.current = false;
        localStorage.removeItem('dashboard_initializing');
        return;
      }
      
      if (isAuthenticated) {
        console.log("User authenticated, syncing data");
        
        // Synchroniser les données utilisateur
        const syncSuccess = await syncUserData();
        
        if (!mountedRef.current) {
          authCheckInProgress.current = false;
          localStorage.removeItem('dashboard_initializing');
          return;
        }
        
        if (!syncSuccess && shouldRetry()) {
          // Retry with exponential backoff
          const currentRetry = incrementRetryCount();
          const retryDelay = calculateRetryDelay(currentRetry);
          
          console.log(`Data sync failed, retrying in ${retryDelay}ms (${currentRetry}/3)`);
          
          authCheckInProgress.current = false;
          localStorage.removeItem('dashboard_initializing');
          
          initTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              initializeDashboard();
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
            localStorage.removeItem('dashboard_initializing');
          }
        }, 700);
      } else {
        // Redirection vers la page de login avec un délai pour éviter les problèmes
        console.log("Authentication failed, redirecting to login");
        if (mountedRef.current) {
          setAuthError(true);
          localStorage.removeItem('dashboard_initializing');
          
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
        localStorage.removeItem('dashboard_initializing');
        
        toast({
          title: "Erreur d'initialisation",
          description: "Une erreur est survenue lors du chargement du tableau de bord",
          variant: "destructive"
        });
      }
    } finally {
      authCheckInProgress.current = false;
    }
  }, [checkAuth, syncUserData, navigate, shouldRetry, incrementRetryCount, calculateRetryDelay, setAuthError, setIsAuthChecking, setIsReady]);
  
  useEffect(() => {
    mountedRef.current = true;
    authCheckInProgress.current = false;
    authCheckAttempted.current = false;
    resetRetryCount();
    
    // Clean up any stale flags on mount
    localStorage.removeItem('dashboard_initializing');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('data_syncing');
    localStorage.removeItem('auth_redirecting');
    
    console.log("Dashboard initialization started");
    
    // Vérifier d'abord si le token local existe avant de démarrer l'initialisation
    const hasLocalToken = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    if (!hasLocalToken) {
      console.log("No local token found, redirecting to login");
      setAuthError(true);
      
      toast({
        title: "Session expirée",
        description: "Veuillez vous reconnecter pour accéder à votre tableau de bord",
        variant: "destructive"
      });
      
      setTimeout(() => {
        if (mountedRef.current) {
          navigate('/login', { replace: true });
        }
      }, 500);
      
      return;
    }
    
    // Démarrer avec un léger délai pour éviter les conflits d'initialisation
    const initialTimer = setTimeout(() => {
      if (mountedRef.current) {
        initializeDashboard();
      }
    }, 800);
    
    // Set up auth state listener
    const cleanup = setupAuthListener();
    
    return () => { 
      console.log("Dashboard initialization cleanup");
      mountedRef.current = false;
      
      // Clear all timers and flags
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      clearTimeout(initialTimer);
      localStorage.removeItem('dashboard_initializing');
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('data_syncing');
      
      cleanup();
    };
  }, [initializeDashboard, setupAuthListener, resetRetryCount, navigate, setAuthError]);

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
