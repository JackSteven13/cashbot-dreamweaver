
import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { useAuthCheck } from './useAuthCheck';
import { useUserDataSync } from './useUserDataSync';
import { useAuthStateListener } from './useAuthStateListener';

export const useDashboardInitialization = () => {
  // État stable avec useState pour les valeurs qui doivent déclencher des rendus
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Références stables qui ne déclenchent pas de rendus
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
  
  // Fonctions utilitaires pour les tentatives
  const resetRetryCount = useCallback(() => {
    initializationRetries.current = 0;
  }, []);
  
  const shouldRetry = useCallback(() => {
    return initializationRetries.current < maxRetries;
  }, [maxRetries]);
  
  const calculateRetryDelay = useCallback((retryCount: number) => {
    return Math.min(1000 * Math.pow(2, retryCount), 8000);
  }, []);
  
  // Fonction d'initialisation avec mémorisation stable
  const initializeDashboard = useCallback(async () => {
    // Éviter les initialisations simultanées
    if (!mountedRef.current || authCheckInProgress.current) {
      console.log("Initialisation déjà en cours ou composant démonté, ignorée");
      return;
    }
    
    // Utiliser un flag local pour prévenir les initialisations concurrentes
    if (localStorage.getItem('dashboard_initializing') === 'true') {
      console.log("Initialisation déjà en cours, ignorée");
      return;
    }
    
    // Marquer le début de l'initialisation
    localStorage.setItem('dashboard_initializing', 'true');
    authCheckInProgress.current = true;
    
    if (mountedRef.current) {
      setIsAuthChecking(true);
    }
    
    try {
      console.log("Initialisation du dashboard démarrée");
      authCheckAttempted.current = true;
      
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) {
        localStorage.removeItem('dashboard_initializing');
        authCheckInProgress.current = false;
        return;
      }
      
      if (isAuthenticated) {
        console.log("Authentification réussie, synchronisation des données");
        
        const syncSuccess = await syncUserData();
        
        if (!mountedRef.current) {
          localStorage.removeItem('dashboard_initializing');
          authCheckInProgress.current = false;
          return;
        }
        
        if (!syncSuccess && shouldRetry()) {
          // Tentative avec délai exponentiel
          initializationRetries.current += 1;
          const retryDelay = calculateRetryDelay(initializationRetries.current);
          
          console.log(`Échec de synchronisation, nouvelle tentative dans ${retryDelay}ms`);
          
          localStorage.removeItem('dashboard_initializing');
          authCheckInProgress.current = false;
          
          if (mountedRef.current) {
            initTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                initializeDashboard();
              }
            }, retryDelay);
          }
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
      localStorage.removeItem('dashboard_initializing');
      authCheckInProgress.current = false;
    }
  }, [checkAuth, syncUserData, shouldRetry, calculateRetryDelay, navigate]);
  
  // Effet d'initialisation unique au montage
  useEffect(() => {
    // Nettoyage des flags au montage
    localStorage.removeItem('dashboard_initializing');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('data_syncing');
    
    mountedRef.current = true;
    authCheckInProgress.current = false;
    authCheckAttempted.current = false;
    resetRetryCount();
    
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
      
      cleanup();
    };
  }, []); // Dépendances vides pour exécution unique
  
  return {
    isAuthChecking,
    isReady,
    authError,
    setAuthError,
    setIsAuthChecking
  };
};

export default useDashboardInitialization;
