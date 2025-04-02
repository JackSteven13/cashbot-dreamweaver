
import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { useAuthCheck } from './useAuthCheck';
import { useUserDataSync } from './useUserDataSync';
import { useAuthStateListener } from './useAuthStateListener';

export const useDashboardInitialization = () => {
  // Stable state management
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Stable references
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckInProgress = useRef(false);
  const authCheckAttempted = useRef(false);
  const initializationRetries = useRef(0);
  const isInitializing = useRef(false);
  
  const navigate = useNavigate();
  
  // Clean up any stale flags immediately to prevent issues
  useEffect(() => {
    // Vérifier si une redirection est déjà en cours
    const isRedirecting = localStorage.getItem('auth_redirecting') === 'true';
    
    if (isRedirecting) {
      console.log("Redirection already in progress, skipping initialization");
      return;
    }
    
    localStorage.removeItem('dashboard_initializing');
    localStorage.removeItem('auth_checking');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('data_syncing');
  }, []);
  
  // Hooks with stable dependencies
  const { checkAuth } = useAuthCheck({ mountedRef });
  const { syncUserData } = useUserDataSync({ mountedRef });
  const { setupAuthListener } = useAuthStateListener({ mountedRef, navigate });
  
  // Initialization function with stable callback
  const initializeDashboard = useCallback(async () => {
    // Prevent simultaneous initializations
    if (!mountedRef.current || authCheckInProgress.current || isInitializing.current) {
      console.log("Initialization already in progress or component unmounted, skipping");
      return;
    }
    
    // Vérifier si une redirection est déjà en cours
    const isRedirecting = localStorage.getItem('auth_redirecting') === 'true';
    
    if (isRedirecting) {
      console.log("Redirection already in progress, skipping initialization");
      return;
    }
    
    // Set initialization flag
    isInitializing.current = true;
    
    // Clean up any stale flags
    localStorage.removeItem('dashboard_initializing');
    localStorage.removeItem('auth_checking');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('data_syncing');
    
    // Mark the beginning of initialization
    authCheckInProgress.current = true;
    
    if (mountedRef.current) {
      setIsAuthChecking(true);
    }
    
    try {
      console.log("Dashboard initialization started");
      authCheckAttempted.current = true;
      
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) {
        authCheckInProgress.current = false;
        isInitializing.current = false;
        return;
      }
      
      if (isAuthenticated) {
        console.log("Authentication successful, syncing data");
        
        const syncSuccess = await syncUserData();
        
        if (!mountedRef.current) {
          authCheckInProgress.current = false;
          isInitializing.current = false;
          return;
        }
        
        if (mountedRef.current) {
          setIsAuthChecking(false);
          setIsReady(true);
          console.log("Dashboard initialization complete, ready to render");
        }
      } else {
        console.log("Authentication failed, redirecting to login");
        
        if (mountedRef.current) {
          setAuthError(true);
          
          toast({
            title: "Session expired",
            description: "Please log in again",
            variant: "destructive"
          });
          
          // Marquer qu'une redirection est en cours
          localStorage.setItem('auth_redirecting', 'true');
          
          // Delay redirect to prevent race conditions
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
              
              // Réinitialiser le flag après la redirection
              setTimeout(() => {
                localStorage.removeItem('auth_redirecting');
              }, 500);
            }
          }, 800);
        }
      }
    } catch (err) {
      console.error("Error during initialization:", err);
      
      if (mountedRef.current) {
        setAuthError(true);
        setIsAuthChecking(false);
      }
    } finally {
      authCheckInProgress.current = false;
      isInitializing.current = false;
    }
  }, [checkAuth, syncUserData, navigate]);
  
  // One-time initialization effect with cleanup
  useEffect(() => {
    mountedRef.current = true;
    authCheckInProgress.current = false;
    authCheckAttempted.current = false;
    initializationRetries.current = 0;
    isInitializing.current = false;
    
    console.log("useDashboardInitialization mounted");
    
    // Vérifier si une redirection est déjà en cours
    const isRedirecting = localStorage.getItem('auth_redirecting') === 'true';
    
    if (isRedirecting) {
      console.log("Redirection already in progress, skipping initialization");
      return;
    }
    
    // Initialize with a short delay
    const initialTimer = setTimeout(() => {
      if (mountedRef.current && !authCheckInProgress.current && !isInitializing.current) {
        initializeDashboard();
      }
    }, 500);
    
    // Set up auth listener
    const cleanup = setupAuthListener();
    
    // Cleanup on unmount
    return () => {
      console.log("useDashboardInitialization unmounted");
      mountedRef.current = false;
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      clearTimeout(initialTimer);
      
      // Clean up any stale flags
      localStorage.removeItem('dashboard_initializing');
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('data_syncing');
      localStorage.removeItem('auth_redirecting');
      
      cleanup();
    };
  }, [setupAuthListener, initializeDashboard]);
  
  return {
    isAuthChecking,
    isReady,
    authError,
    setAuthError,
    setIsAuthChecking
  };
};

export default useDashboardInitialization;
