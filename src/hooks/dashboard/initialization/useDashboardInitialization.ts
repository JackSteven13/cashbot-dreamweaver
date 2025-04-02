
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
  
  const navigate = useNavigate();
  
  // Hooks d'authentification avec protection contre les montages/démontages
  const { checkAuth } = useAuthCheck({ mountedRef });
  const { setupAuthListener } = useAuthStateListener({ mountedRef, navigate });
  const { syncUserData } = useUserDataSync({ mountedRef });
  
  // Normaliser les nettoyages pour éviter les fuites de mémoire
  const addCleanupFunction = useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup);
  }, []);
  
  // Fonction d'initialisation principale qui s'exécute une seule fois
  // et gère correctement les erreurs et les transitions d'état
  const initializeDashboard = useCallback(async () => {
    if (initializationAttempted.current || !mountedRef.current) return;
    initializationAttempted.current = true;
    
    setIsAuthChecking(true);
    setAuthError(null);
    setIsReady(false);
    
    try {
      // Stocker un flag d'initialisation dans localStorage pour debugging
      try {
        const now = new Date().toISOString();
        localStorage.setItem('dashboard_initialization_timestamp', now);
      } catch (e) {
        console.error("Erreur lors de la définition du timestamp d'initialisation:", e);
      }
      
      console.log("Initialisation du dashboard démarrée");
      
      // Étape 1: Vérifier l'authentification
      const isAuthenticated = await checkAuth();
      
      if (!mountedRef.current) return;
      
      // Journaliser le résultat de la vérification initiale
      console.log("Vérification d'authentification initiale terminée, résultat:", isAuthenticated);
      
      if (isAuthenticated) {
        // Étape 2: Configurer l'écouteur d'état d'authentification
        console.log("Authentification réussie, synchronisation des données");
        const authCleanup = setupAuthListener();
        if (authCleanup) addCleanupFunction(authCleanup);
        
        // Étape 3: Synchroniser les données utilisateur
        console.log("Synchronisation des données utilisateur après authentification");
        await syncUserData();
        
        if (!mountedRef.current) return;
        
        // Tout est prêt, marquer l'initialisation comme terminée
        console.log("Initialisation du dashboard terminée, prêt à afficher");
        setIsReady(true);
      } else {
        // En cas d'échec d'authentification, ne pas définir d'erreur car checkAuth
        // gère déjà la redirection
        console.log("Échec de l'authentification initiale");
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du dashboard:", error);
      
      if (mountedRef.current) {
        setAuthError("Une erreur est survenue lors de l'initialisation.");
        
        // Afficher un toast pour informer l'utilisateur
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
    }
  }, [checkAuth, setupAuthListener, syncUserData, addCleanupFunction]);
  
  // Effet de montage unique avec protection contre les exécutions multiples
  useEffect(() => {
    mountedRef.current = true;
    
    // Vérifier si une initialisation récente a eu lieu
    try {
      const lastInit = localStorage.getItem('dashboard_initialization_timestamp');
      const now = Date.now();
      const lastInitTime = lastInit ? new Date(lastInit).getTime() : 0;
      const timeSinceLastInit = now - lastInitTime;
      
      console.log(`Temps écoulé depuis la dernière initialisation: ${Math.round(timeSinceLastInit / 1000)}s`);
      
      // Si la dernière initialisation est trop récente, attendre un peu
      if (lastInit && timeSinceLastInit < 2000) {
        console.log("Initialisation récente détectée, ajout d'un délai de sécurité");
        const timer = setTimeout(() => {
          if (mountedRef.current) initializeDashboard();
        }, 2000 - timeSinceLastInit);
        
        return () => clearTimeout(timer);
      } else {
        // Sinon, initialiser normalement
        initializeDashboard();
      }
    } catch (e) {
      console.error("Erreur lors de la vérification du timestamp d'initialisation:", e);
      initializeDashboard();
    }
    
    // Nettoyer correctement lors du démontage
    return () => {
      console.log("Démontage du hook useDashboardInitialization, nettoyage des effets");
      mountedRef.current = false;
      
      // Exécuter toutes les fonctions de nettoyage enregistrées
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (e) {
          console.error("Erreur lors du nettoyage:", e);
        }
      });
      
      // Vider le tableau après l'exécution
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
