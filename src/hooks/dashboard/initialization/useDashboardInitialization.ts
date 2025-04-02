
import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { useAuthCheck } from './useAuthCheck';
import { useUserDataSync } from './useUserDataSync';
import { useAuthStateListener } from './useAuthStateListener';

export const useDashboardInitialization = () => {
  // État stable avec useState
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Références stables
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckInProgress = useRef(false);
  const authCheckAttempted = useRef(false);
  const initializationRetries = useRef(0);
  const maxRetries = 3;
  
  const navigate = useNavigate();
  
  // Hooks avec dépendances stabilisées
  const { checkAuth } = useAuthCheck({ mountedRef });
  const { syncUserData } = useUserDataSync({ mountedRef });
  const { setupAuthListener } = useAuthStateListener({ mountedRef, navigate });
  
  // Fonction d'initialisation avec mémorisation stable
  const initializeDashboard = useCallback(async () => {
    // Éviter les initialisations simultanées
    if (!mountedRef.current || authCheckInProgress.current) {
      console.log("Initialisation déjà en cours ou composant démonté, ignorée");
      return;
    }
    
    // Nettoyer les flags de status
    localStorage.removeItem('dashboard_initializing');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('data_syncing');
    localStorage.removeItem('auth_redirecting');
    
    // Marquer le début de l'initialisation
    authCheckInProgress.current = true;
    
    if (mountedRef.current) {
      setIsAuthChecking(true);
    }
    
    try {
      console.log("Initialisation du dashboard démarrée");
      authCheckAttempted.current = true;
      
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) {
        authCheckInProgress.current = false;
        return;
      }
      
      if (isAuthenticated) {
        console.log("Authentification réussie, synchronisation des données");
        
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
        console.log("Authentification échouée, redirection vers login");
        
        if (mountedRef.current) {
          setAuthError(true);
          
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter",
            variant: "destructive"
          });
          
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
            }
          }, 800);
        }
      }
    } catch (err) {
      console.error("Erreur pendant l'initialisation:", err);
      
      if (mountedRef.current) {
        setAuthError(true);
        setIsAuthChecking(false);
      }
    } finally {
      authCheckInProgress.current = false;
    }
  }, [checkAuth, syncUserData, navigate]);
  
  // Effet d'initialisation unique au montage
  useEffect(() => {
    // Nettoyage des flags au montage
    localStorage.removeItem('dashboard_initializing');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('data_syncing');
    localStorage.removeItem('auth_redirecting');
    
    mountedRef.current = true;
    authCheckInProgress.current = false;
    authCheckAttempted.current = false;
    initializationRetries.current = 0;
    
    console.log("useDashboardInitialization monté");
    
    // Initialisation avec délai court pour éviter les conflits
    const initialTimer = setTimeout(() => {
      if (mountedRef.current && !authCheckInProgress.current) {
        initializeDashboard();
      }
    }, 500);
    
    // Configuration du listener d'authentification
    const cleanup = setupAuthListener();
    
    // Nettoyage complet au démontage
    return () => {
      console.log("useDashboardInitialization démonté");
      mountedRef.current = false;
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      clearTimeout(initialTimer);
      
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
