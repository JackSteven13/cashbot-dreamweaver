
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthSessionCheck } from './auth/useAuthSessionCheck';
import { useUserDataSync } from './session/useUserDataSync';
import { useAuthStateListener } from './dashboard/useAuthStateListener';
import { useUserDataRefresh } from './session/useUserDataRefresh';
import { toast } from '@/components/ui/use-toast';

export const useDashboardInitialization = () => {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  const { authError, setAuthError, checkAuth, cleanup: cleanupAuthCheck } = useAuthSessionCheck();
  const { refreshUserData } = useUserDataRefresh();
  const { setupAuthListener } = useAuthStateListener();
  const { syncUserData: syncData } = useUserDataSync();
  
  // Function to sync user data - wrapper around the hook function
  const syncUserData = useCallback(async () => {
    return syncData(mountedRef);
  }, [syncData]);
  
  useEffect(() => {
    mountedRef.current = true;
    
    const initDashboard = async () => {
      setIsAuthChecking(true);
      try {
        console.log("Starting dashboard auth check");
        const isAuthenticated = await checkAuth();
        
        if (!mountedRef.current) return;
        
        if (isAuthenticated) {
          console.log("User authenticated, initializing dashboard");
          
          // Sync user data in background
          setTimeout(async () => {
            if (mountedRef.current) {
              await refreshUserData().catch(err => {
                console.warn("Background sync failed:", err);
              });
              
              if (mountedRef.current && !isReady) {
                setIsReady(true);
              }
            }
          }, 500);
          
          setIsAuthChecking(false);
        } else {
          console.log("Authentication failed, redirecting to login");
          if (mountedRef.current) {
            setIsAuthChecking(false);
            
            toast({
              title: "Authentification nécessaire",
              description: "Veuillez vous connecter pour accéder au tableau de bord",
              variant: "destructive",
            });
            
            setTimeout(() => {
              if (mountedRef.current) {
                navigate('/login', { replace: true });
              }
            }, 300);
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
    
    // Start with slight delay to avoid initialization conflicts
    setTimeout(() => {
      if (mountedRef.current) {
        initDashboard();
      }
    }, 300);
    
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
      cleanupAuthCheck();
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      clearTimeout(forceReadyTimeout);
      subscription.unsubscribe();
    };
  }, [checkAuth, navigate, refreshUserData, isReady, setupAuthListener, cleanupAuthCheck]);

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
