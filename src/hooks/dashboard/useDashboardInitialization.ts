
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthCheck } from './useAuthCheck';
import { useUserDataSync } from './useUserDataSync';
import { useRetryLogic } from './useRetryLogic';
import { useAuthStateListener } from './useAuthStateListener';

export const useDashboardInitialization = () => {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckInProgress = useRef(false);
  const authCheckAttempted = useRef(false);
  
  const { retryCount, shouldRetry, incrementRetryCount, calculateRetryDelay, resetRetryCount } = 
    useRetryLogic({ maxRetries: 3 });
    
  const { checkAuth } = useAuthCheck({ mountedRef });
  const { syncUserData } = useUserDataSync({ mountedRef });
  const { setupAuthListener } = useAuthStateListener({ mountedRef });
  
  // Fonction améliorée pour initialiser le tableau de bord
  const initializeDashboard = useCallback(async () => {
    if (authCheckAttempted.current) {
      console.log("Auth check already attempted, skipping duplicate initialization");
      return;
    }
    
    if (authCheckInProgress.current) {
      console.log("Initialization already in progress, skipping");
      return;
    }
    
    authCheckInProgress.current = true;
    setIsAuthChecking(true);
    
    try {
      console.log("Starting dashboard initialization");
      authCheckAttempted.current = true;
      
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) {
        console.log("Component unmounted during initialization");
        authCheckInProgress.current = false;
        return;
      }
      
      if (isAuthenticated) {
        console.log("User authenticated, syncing data");
        
        // Synchroniser les données utilisateur
        const syncSuccess = await syncUserData();
        
        if (!mountedRef.current) {
          authCheckInProgress.current = false;
          return;
        }
        
        if (!syncSuccess && shouldRetry()) {
          // Retry with exponential backoff
          const currentRetry = incrementRetryCount();
          const retryDelay = calculateRetryDelay(currentRetry);
          
          console.log(`Data sync failed, retrying in ${retryDelay}ms (${currentRetry}/3)`);
          
          authCheckInProgress.current = false;
          
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
          }
        }, 700);
      } else {
        // Redirection vers la page de login avec un délai pour éviter les problèmes
        console.log("Authentication failed, redirecting to login");
        if (mountedRef.current) {
          setAuthError(true);
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
    } finally {
      authCheckInProgress.current = false;
    }
  }, [checkAuth, syncUserData, navigate, shouldRetry, incrementRetryCount, calculateRetryDelay]);
  
  useEffect(() => {
    mountedRef.current = true;
    authCheckInProgress.current = false;
    authCheckAttempted.current = false;
    resetRetryCount();
    
    console.log("Dashboard initialization started");
    // Démarrer avec un léger délai pour éviter les conflits d'initialisation
    setTimeout(() => {
      if (mountedRef.current) {
        initializeDashboard();
      }
    }, 500);
    
    // Set up auth state listener
    const cleanup = setupAuthListener();
    
    return () => { 
      console.log("Dashboard initialization cleanup");
      mountedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      cleanup();
    };
  }, [initializeDashboard, setupAuthListener, resetRetryCount]);

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
