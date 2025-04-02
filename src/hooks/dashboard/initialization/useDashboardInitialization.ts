
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInitializationState } from '../useInitializationState';
import { useInitializationRefs } from '../useInitializationRefs';
import { useRetryAttempts } from '../useRetryAttempts';
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
  const { setupAuthListener } = useAuthStateListener({ mountedRef, navigate });
  
  // Dashboard initialization function
  const initializeDashboard = useCallback(async () => {
    // Prévenir les initialisations dupliquées
    if (!mountedRef.current || authCheckInProgress.current) {
      console.log("Initialisation déjà en cours ou composant démonté, ignorée");
      return;
    }
    
    // Utiliser un flag local au lieu d'un état global pour éviter les re-rendus
    if (localStorage.getItem('dashboard_initializing') === 'true') {
      console.log("Initialisation du dashboard déjà en cours depuis un autre composant");
      return;
    }
    
    // Marquer le début de l'initialisation
    localStorage.setItem('dashboard_initializing', 'true');
    authCheckInProgress.current = true;
    
    if (mountedRef.current) {
      setIsAuthChecking(true);
    }
    
    try {
      console.log("Démarrage de l'initialisation du dashboard");
      authCheckAttempted.current = true;
      
      // Vérifier d'abord s'il existe un token
      const hasLocalToken = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      if (!hasLocalToken) {
        console.log("Aucun token local trouvé, redirection vers login");
        
        if (mountedRef.current) {
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
        }
        
        authCheckInProgress.current = false;
        localStorage.removeItem('dashboard_initializing');
        return;
      }
      
      // Tentative d'authentification
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) {
        console.log("Composant démonté pendant l'initialisation");
        authCheckInProgress.current = false;
        localStorage.removeItem('dashboard_initializing');
        return;
      }
      
      if (isAuthenticated) {
        console.log("Utilisateur authentifié, synchronisation des données");
        
        // Synchronisation des données utilisateur
        const syncSuccess = await syncUserData();
        
        if (!mountedRef.current) {
          authCheckInProgress.current = false;
          localStorage.removeItem('dashboard_initializing');
          return;
        }
        
        if (!syncSuccess && shouldRetry()) {
          // Nouvelle tentative avec backoff exponentiel
          const currentRetry = incrementRetryCount();
          const retryDelay = calculateRetryDelay(currentRetry);
          
          console.log(`Échec de synchronisation, nouvelle tentative dans ${retryDelay}ms (${currentRetry}/3)`);
          
          authCheckInProgress.current = false;
          localStorage.removeItem('dashboard_initializing');
          
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
          
          // Délai court avant de marquer comme prêt pour éviter les problèmes de rendu
          setTimeout(() => {
            if (mountedRef.current) {
              console.log("Dashboard prêt");
              setIsReady(true);
            }
          }, 300);
        }
      } else {
        // Redirection vers login
        console.log("Authentification échouée, redirection vers login");
        
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
      console.error("Erreur pendant l'initialisation du dashboard:", err);
      
      if (mountedRef.current) {
        setAuthError(true);
        setIsAuthChecking(false);
        
        toast({
          title: "Erreur d'initialisation",
          description: "Une erreur est survenue lors du chargement du tableau de bord",
          variant: "destructive"
        });
      }
    } finally {
      authCheckInProgress.current = false;
      localStorage.removeItem('dashboard_initializing');
    }
  }, [checkAuth, syncUserData, navigate, shouldRetry, incrementRetryCount, calculateRetryDelay, setAuthError, setIsAuthChecking, setIsReady]);
  
  // Effet d'initialisation
  useEffect(() => {
    // Initialisation des références
    mountedRef.current = true;
    authCheckInProgress.current = false;
    authCheckAttempted.current = false;
    resetRetryCount();
    
    // Nettoyage des flags obsolètes
    localStorage.removeItem('dashboard_initializing');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('data_syncing');
    localStorage.removeItem('auth_redirecting');
    
    console.log("Initialisation du dashboard commencée");
    
    // Vérification initiale des tokens
    const hasLocalToken = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    // Variable locale pour la logique conditionnelle
    let initialTimer: NodeJS.Timeout | null = null;
    let shouldContinue = true;
    
    if (!hasLocalToken) {
      console.log("Aucun token local trouvé, redirection vers login");
      
      if (mountedRef.current) {
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
        
        shouldContinue = false;
      }
    }
    
    // Configuration des timers uniquement si nous devons continuer
    if (shouldContinue) {
      // Démarrage avec un léger délai pour éviter les conflits
      initialTimer = setTimeout(() => {
        if (mountedRef.current && !authCheckInProgress.current) {
          initializeDashboard();
        }
      }, 800);
    }
    
    // Configuration du listener d'authentification (toujours, indépendamment de la présence du token)
    const cleanup = setupAuthListener();
    
    // Fonction de nettoyage
    return () => { 
      console.log("Nettoyage de l'initialisation du dashboard");
      mountedRef.current = false;
      
      // Nettoyage de tous les timers et flags
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      if (initialTimer) {
        clearTimeout(initialTimer);
      }
      
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
