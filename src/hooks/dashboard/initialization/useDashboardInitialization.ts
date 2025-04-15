
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
  const [fastInit, setFastInit] = useState(false); // Pour le chargement rapide des données
  
  const mountedRef = useRef(true);
  const initializationAttempted = useRef(false);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const initializing = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fastInitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const navigate = useNavigate();
  
  // Hooks d'authentification avec protection contre les montages/démontages
  const { checkAuth } = useAuthCheck({ mountedRef });
  const { setupAuthListener } = useAuthStateListener({ mountedRef, navigate });
  const { syncUserData } = useUserDataSync({ mountedRef });
  
  // Normaliser les nettoyages pour éviter les fuites de mémoire
  const addCleanupFunction = useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup);
  }, []);
  
  // Fonction pour un chargement rapide des données du cache
  const initializeFastLoad = useCallback(() => {
    // Vérifier s'il y a des données utilisateur en cache
    const cachedName = localStorage.getItem('lastKnownUsername');
    const cachedSubscription = localStorage.getItem('subscription');
    const cachedBalance = localStorage.getItem('currentBalance');
    
    // Si oui, permettre un affichage immédiat
    if (cachedName || cachedSubscription || cachedBalance) {
      console.log("Données en cache trouvées, initialisation rapide");
      setFastInit(true);
      
      // Déclencher un événement pour précharger l'interface
      window.dispatchEvent(new CustomEvent('user:fast-init', {
        detail: { 
          username: cachedName,
          subscription: cachedSubscription,
          balance: cachedBalance
        }
      }));
      
      setIsReady(true);
    } else {
      console.log("Aucune donnée en cache trouvée, initialisation standard");
    }
  }, []);
  
  // Fonction d'initialisation principale optimisée pour des chargements plus rapides
  const initializeDashboard = useCallback(async () => {
    // Vérifier si l'initialisation est déjà en cours
    if (initializing.current || !mountedRef.current) return;
    
    initializing.current = true;
    initializationAttempted.current = true;
    
    try {
      console.log(`Initialisation du dashboard démarrée`);
      
      // Utiliser un modèle de chargement par étapes pour afficher plus rapidement
      // Etape 1: Vérifier d'abord l'authentification (bloquant)
      if (!mountedRef.current) return;
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) return;
      
      if (isAuthenticated) {
        // Etape 2: Configurer l'écouteur d'état d'authentification (non bloquant)
        const authCleanup = setupAuthListener();
        if (authCleanup) addCleanupFunction(authCleanup);
        
        // Etape 3: Afficher les données en cache immédiatement
        setIsReady(true);
        
        // Etape 4: Synchroniser les données complètes en arrière-plan
        syncUserData().then(success => {
          if (mountedRef.current && success) {
            // Notification discrète de la synchronisation réussie
            toast({
              title: "Données synchronisées",
              description: "Vos données ont été mises à jour en arrière-plan",
              duration: 2000,
            });
          }
        });
        
        // Déclencher un événement pour notifier les composants que l'initialisation est terminée
        window.dispatchEvent(new CustomEvent('dashboard:initialized', {
          detail: { success: true }
        }));
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du dashboard:", error);
      
      if (mountedRef.current) {
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
  
  // Effet de montage avec initialisation optimisée
  useEffect(() => {
    mountedRef.current = true;
    
    // Initialiser rapidement avec les données en cache (50ms)
    fastInitTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        initializeFastLoad();
      }
    }, 50);
    
    // Démarrer l'initialisation complète peu après (300ms)
    initTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !initializing.current) {
        initializeDashboard();
      }
    }, 300);
    
    return () => {
      console.log("Démontage du hook useDashboardInitialization");
      mountedRef.current = false;
      
      // Nettoyer tous les timeouts
      if (fastInitTimeoutRef.current) {
        clearTimeout(fastInitTimeoutRef.current);
      }
      
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
  }, [initializeDashboard, initializeFastLoad]);
  
  // Exposer les états pour le rendu optimisé du Dashboard
  return useMemo(() => ({
    isAuthChecking,
    isReady,
    fastInit,
    authError
  }), [isAuthChecking, isReady, fastInit, authError]);
};

export default useDashboardInitialization;
