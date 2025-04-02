
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
  const maxRetries = 3;
  
  const navigate = useNavigate();
  
  // Hooks with stable dependencies
  const { checkAuth } = useAuthCheck({ mountedRef });
  const { syncUserData } = useUserDataSync({ mountedRef });
  const { setupAuthListener } = useAuthStateListener({ mountedRef, navigate });
  
  // Initialization function with stable callback
  const initializeDashboard = useCallback(async () => {
    // Prevent simultaneous initializations
    if (!mountedRef.current || authCheckInProgress.current) {
      console.log("Initialization already in progress or component unmounted, skipping");
      return;
    }
    
    // Clean up any stale flags in localStorage
    localStorage.removeItem('dashboard_initializing');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('data_syncing');
    localStorage.removeItem('auth_redirecting');
    
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
        return;
      }
      
      if (isAuthenticated) {
        console.log("Authentication successful, syncing data");
        
        const syncSuccess = await syncUserData();
        
        if (!mountedRef.current) {
          authCheckInProgress.current = false;
          return;
        }
        
        if (mountedRef.current) {
          setIsAuthChecking(false);
          setIsReady(true);
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
          
          // Delay redirect to prevent race conditions
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
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
    }
  }, [checkAuth, syncUserData, navigate]);
  
  // One-time initialization effect
  useEffect(() => {
    // Clean up any stale flags
    localStorage.removeItem('dashboard_initializing');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('data_syncing');
    localStorage.removeItem('auth_redirecting');
    
    mountedRef.current = true;
    authCheckInProgress.current = false;
    authCheckAttempted.current = false;
    initializationRetries.current = 0;
    
    console.log("useDashboardInitialization mounted");
    
    // Initialize with a short delay
    const initialTimer = setTimeout(() => {
      if (mountedRef.current && !authCheckInProgress.current) {
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
