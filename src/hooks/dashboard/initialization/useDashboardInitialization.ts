
import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { useAuthCheck } from './useAuthCheck';
import { useAuthStateListener } from './useAuthStateListener';
import { useUserDataSync } from './useUserDataSync';

export const useDashboardInitialization = () => {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const mountedRef = useRef(true);
  const initializationAttempted = useRef(false);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const initializing = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxAttemptsRef = useRef(0);
  
  const navigate = useNavigate();
  
  // Hooks d'authentification avec protection contre les montages/démontages
  const { checkAuth } = useAuthCheck({ mountedRef });
  const { setupAuthListener } = useAuthStateListener({ mountedRef, navigate });
  const { syncUserData } = useUserDataSync({ mountedRef });
  
  // Normaliser les nettoyages pour éviter les fuites de mémoire
  const addCleanupFunction = useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup);
  }, []);
  
  // Fonction d'initialisation principale avec un timeout plus court
  const initializeDashboard = useCallback(async () => {
    // Vérifier si l'initialisation est déjà en cours ou déjà tentée
    if (initializing.current || !mountedRef.current) return;
    
    initializing.current = true;
    initializationAttempted.current = true;
    maxAttemptsRef.current++;
    
    try {
      // Laisser tout le processus se dérouler dans un seul flux
      console.log(`Initialisation du dashboard démarrée (tentative ${maxAttemptsRef.current})`);
      
      // Exécuter toutes les vérifications en parallèle lorsque possible
      if (!mountedRef.current) return;
      
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) return;
      
      if (isAuthenticated) {
        // Configurer l'écouteur d'état d'authentification et synchroniser en parallèle
        const authCleanup = setupAuthListener();
        if (authCleanup) addCleanupFunction(authCleanup);
        
        await syncUserData();
        
        if (!mountedRef.current) return;
        
        // Tout est prêt, marquer l'initialisation comme terminée
        console.log("Initialisation complétée, prêt à afficher");
        setIsReady(true);
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du dashboard:", error);
      
      if (mountedRef.current) {
        // Si nombre de tentatives < 3, réessayer
        if (maxAttemptsRef.current < 3) {
          console.log(`Nouvelle tentative d'initialisation (${maxAttemptsRef.current}/3)...`);
          setTimeout(() => {
            initializing.current = false;
            initializeDashboard();
          }, 1000);
          return;
        }
        
        setAuthError("Une erreur est survenue lors de l'initialisation.");
        
        toast({
          title: "Erreur d'initialisation",
          description: "Impossible d'initialiser le dashboard. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    } finally {
      // S'assurer que l'état de chargement est toujours mis à jour
      if (mountedRef.current) {
        setIsAuthChecking(false);
      }
      
      // Réinitialiser le verrou d'initialisation
      initializing.current = false;
    }
  }, [checkAuth, setupAuthListener, syncUserData, addCleanupFunction]);
  
  // Effet de montage avec un démarrage plus rapide
  useEffect(() => {
    mountedRef.current = true;
    maxAttemptsRef.current = 0;
    
    // Démarrer l'initialisation immédiatement
    initTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !initializing.current) {
        initializeDashboard();
      }
    }, 100); // Délai très court
    
    return () => {
      console.log("Démontage du hook useDashboardInitialization");
      mountedRef.current = false;
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      // Exécuter toutes les fonctions de nettoyage enregistrées
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (e) {
          console.error("Erreur lors du nettoyage:", e);
        }
      });
      
      cleanupFunctionsRef.current = [];
    };
  }, [initializeDashboard]);
  
  // Exposer les états pour permettre au Dashboard de rendre en conséquence
  return useMemo(() => ({
    isAuthChecking,
    isReady,
    authError
  }), [isAuthChecking, isReady, authError]);
};

export default useDashboardInitialization;
