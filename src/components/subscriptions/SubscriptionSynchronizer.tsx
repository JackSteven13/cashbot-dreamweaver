
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { verifyAuth } from "@/utils/auth/verificationUtils";

interface SubscriptionSynchronizerProps {
  onSync?: (subscription: string) => void;
  forceCheck?: boolean;
}

/**
 * Composant invisible qui synchronise l'abonnement entre Supabase et le localStorage
 * avec une gestion améliorée de la fiabilité et du cache
 */
const SubscriptionSynchronizer = ({ onSync, forceCheck = false }: SubscriptionSynchronizerProps) => {
  const [lastChecked, setLastChecked] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const isMounted = useRef(true);
  const syncInProgress = useRef(false);
  const syncFailures = useRef(0);
  const maxRetries = 6;
  const cacheExpiry = 60000; // 1 minute
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fonction de synchronisation extraite pour pouvoir l'utiliser dans le cleanup
  const syncSubscription = useCallback(async (force: boolean = false) => {
    // Éviter les appels simultanés qui peuvent causer des instabilités
    if (syncInProgress.current || !isMounted.current) {
      return;
    }
    
    try {
      syncInProgress.current = true;
      
      // Mise en place d'un timeout de sécurité pour éviter les blocages
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        if (syncInProgress.current && isMounted.current) {
          console.log("Sync timeout reached, resetting sync state");
          syncInProgress.current = false;
        }
      }, 20000); // 20 secondes de timeout maximal
      
      // Vérifier si l'utilisateur est connecté avec une méthode robuste
      const isAuth = await verifyAuth();
      if (!isAuth) {
        console.log("Pas de session active valide, synchronisation ignorée");
        syncInProgress.current = false;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("Pas de session active, synchronisation ignorée");
        syncInProgress.current = false;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        return;
      }
      
      // Déterminer si on doit forcer une synchronisation
      const now = Date.now();
      const shouldForceSync = force || forceCheck || (now - lastChecked > cacheExpiry);
      
      if (!shouldForceSync && !forceCheck) {
        syncInProgress.current = false;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        return;
      }
      
      setLastChecked(now);
      console.log("Synchronisation de l'abonnement depuis Supabase...");
      
      // Ajout d'un délai avant la requête pour éviter les problèmes de course
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Essayer directement la requête avec un délai de protection
      let attempt = 0;
      let success = false;
      
      while (attempt < 3 && !success && isMounted.current) {
        try {
          const { data: userData, error: directError } = await supabase
            .from('user_balances')
            .select('subscription')
            .eq('id', session.user.id)
            .single();
              
          if (!directError && userData && userData.subscription) {
            const currentLocalSub = localStorage.getItem('subscription');
            if (currentLocalSub !== userData.subscription) {
              console.log(`Mise à jour de l'abonnement: ${currentLocalSub} -> ${userData.subscription}`);
              localStorage.setItem('subscription', userData.subscription);
              
              if (onSync && isMounted.current) {
                onSync(userData.subscription);
              }
            }
            
            // Réinitialiser le compteur de tentatives et d'échecs
            setRetryCount(0);
            syncFailures.current = 0;
            setIsInitialized(true);
            success = true;
          } else {
            attempt++;
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 700 * attempt));
            }
          }
        } catch (err) {
          attempt++;
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 700 * attempt));
          }
        }
      }
      
      if (!success && retryCount < maxRetries && isMounted.current) {
        // Si la méthode échoue, réessayer plus tard avec backoff exponentiel
        syncFailures.current++;
        console.log(`Échec de synchronisation (${syncFailures.current}), nouvelle tentative prévue (${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        
        // Tentative avec délai exponentiel mais plafonné
        const backoffDelay = Math.min(2000 * Math.pow(1.5, retryCount), 20000);
        setTimeout(() => {
          if (isMounted.current) {
            syncSubscription(true);
          }
        }, backoffDelay);
      }
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
      
      // Réessayer en cas d'erreur réseau ou de connexion avec backoff exponentiel
      if (retryCount < maxRetries && isMounted.current) {
        syncFailures.current++;
        setRetryCount(prev => prev + 1);
        const backoffDelay = Math.min(3000 * Math.pow(1.5, retryCount), 30000);
        console.log(`Erreur de synchronisation (${syncFailures.current}), nouvelle tentative dans ${backoffDelay}ms`);
        
        setTimeout(() => {
          if (isMounted.current) {
            syncSubscription(true);
          }
        }, backoffDelay);
      }
    } finally {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncInProgress.current = false;
    }
  }, [onSync, forceCheck, lastChecked, retryCount, maxRetries, isInitialized]);
  
  useEffect(() => {
    isMounted.current = true;
    syncInProgress.current = false;
    syncFailures.current = 0;
    
    console.log("SubscriptionSynchronizer mounted");
    
    // Synchroniser immédiatement au montage avec un délai pour éviter les conflits d'initialisation
    initialSyncTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && !syncInProgress.current) {
        syncSubscription(true);
      }
    }, 3000);
    
    // Configurer un intervalle pour synchroniser périodiquement
    intervalIdRef.current = setInterval(() => {
      if (isMounted.current && !syncInProgress.current) {
        syncSubscription();
      }
    }, 45000); // Vérifier toutes les 45 secondes
    
    // Ajouter un event listener pour les changements de focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current && !syncInProgress.current) {
        // Re-synchroniser quand l'utilisateur revient sur la page
        syncSubscription(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log("SubscriptionSynchronizer unmounting");
      isMounted.current = false;
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      if (initialSyncTimeoutRef.current) {
        clearTimeout(initialSyncTimeoutRef.current);
      }
      
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncSubscription]);
  
  // Composant invisible
  return null;
};

export default SubscriptionSynchronizer;
