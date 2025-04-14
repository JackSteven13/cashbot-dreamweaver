
import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { useAuthCheck } from './useAuthCheck';
import { useAuthStateListener } from './useAuthStateListener';
import { useUserDataSync } from './useUserDataSync';
import { applyUserSwitchGuard } from '@/utils/userSwitchGuard';

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
  const maxAttemptsRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Fonction d'initialisation principale plus robuste
  const initializeDashboard = useCallback(async () => {
    // Vérifier si l'initialisation est déjà en cours ou déjà tentée
    if (initializing.current || !mountedRef.current) return;
    
    initializing.current = true;
    initializationAttempted.current = true;
    maxAttemptsRef.current++;
    
    // Vérifier s'il y a eu un changement d'utilisateur
    applyUserSwitchGuard();
    
    try {
      // Laisser tout le processus se dérouler dans un seul flux
      console.log(`Initialisation du dashboard démarrée (tentative ${maxAttemptsRef.current})`);
      
      // Exécuter toutes les vérifications en parallèle lorsque possible
      if (!mountedRef.current) return;
      
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) return;
      
      if (isAuthenticated) {
        // Configurer l'écouteur d'état d'authentification
        const authCleanup = setupAuthListener();
        if (authCleanup) addCleanupFunction(authCleanup);
        
        // Synchroniser les données utilisateur avec plusieurs tentatives si nécessaire
        let syncSuccess = await syncUserData();
        
        // Si la synchronisation échoue, essayer à nouveau jusqu'à 2 fois
        if (!syncSuccess && mountedRef.current) {
          console.log("Première synchronisation échouée, nouvelle tentative dans 800ms...");
          await new Promise(resolve => setTimeout(resolve, 800));
          syncSuccess = await syncUserData();
          
          if (!syncSuccess && mountedRef.current) {
            console.log("Deuxième synchronisation échouée, dernière tentative dans 1200ms...");
            await new Promise(resolve => setTimeout(resolve, 1200));
            syncSuccess = await syncUserData();
          }
        }
        
        if (!mountedRef.current) return;
        
        // Déclencher un événement pour notifier les composants que l'initialisation est terminée
        window.dispatchEvent(new CustomEvent('dashboard:initialized', {
          detail: { success: true }
        }));
        
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
          
          // Nettoyer tout timeout existant
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            initializing.current = false;
            initializeDashboard();
          }, 1000 * maxAttemptsRef.current); // Délai croissant entre les tentatives
          
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
  
  // Effet de montage avec un démarrage plus rapide et plus fiable
  useEffect(() => {
    mountedRef.current = true;
    maxAttemptsRef.current = 0;
    
    // Initialiser rapidement avec les données en cache
    fastInitTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        initializeFastLoad();
      }
    }, 100);
    
    // Démarrer l'initialisation complète peu après
    initTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !initializing.current) {
        initializeDashboard();
      }
    }, 300); // Délai légèrement plus long pour laisser le fast init agir
    
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
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
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
  
  // Exposer les états pour permettre au Dashboard de rendre en conséquence
  return useMemo(() => ({
    isAuthChecking,
    isReady,
    fastInit,
    authError
  }), [isAuthChecking, isReady, fastInit, authError]);
};

export default useDashboardInitialization;
