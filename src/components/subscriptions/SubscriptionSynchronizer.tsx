
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
  const maxRetries = 3; // Réduit pour éviter trop de requêtes
  const cacheExpiry = 60000; // 1 minute
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fonction de synchronisation optimisée
  const syncSubscription = useCallback(async (force: boolean = false) => {
    // Éviter les appels simultanés
    if (syncInProgress.current || !isMounted.current) {
      return;
    }
    
    try {
      syncInProgress.current = true;
      
      // Protection contre les timeouts
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        if (syncInProgress.current && isMounted.current) {
          syncInProgress.current = false;
        }
      }, 10000); // Timeout réduit à 10 secondes
      
      // Vérifier session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
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
      
      try {
        const { data: userData, error: directError } = await supabase
          .from('user_balances')
          .select('subscription')
          .eq('id', session.user.id)
          .single();
            
        if (!directError && userData && userData.subscription) {
          const currentLocalSub = localStorage.getItem('subscription');
          if (currentLocalSub !== userData.subscription) {
            localStorage.setItem('subscription', userData.subscription);
            
            if (onSync && isMounted.current) {
              onSync(userData.subscription);
            }
          }
          
          // Réinitialiser le compteur
          setRetryCount(0);
          syncFailures.current = 0;
          setIsInitialized(true);
        }
      } catch (err) {
        // Simple gestion d'erreur
        if (retryCount < maxRetries && isMounted.current) {
          syncFailures.current++;
          setRetryCount(prev => prev + 1);
          const backoffDelay = Math.min(2000 * Math.pow(1.5, retryCount), 10000);
          setTimeout(() => {
            if (isMounted.current) {
              syncSubscription(true);
            }
          }, backoffDelay);
        }
      }
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
    } finally {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncInProgress.current = false;
    }
  }, [onSync, forceCheck, lastChecked, retryCount, maxRetries, isInitialized]);
  
  // Effet d'initialisation
  useEffect(() => {
    isMounted.current = true;
    syncInProgress.current = false;
    syncFailures.current = 0;
    
    // Synchroniser rapidement
    initialSyncTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && !syncInProgress.current) {
        syncSubscription(true);
      }
    }, 1000);
    
    // Vérification périodique moins fréquente
    intervalIdRef.current = setInterval(() => {
      if (isMounted.current && !syncInProgress.current) {
        syncSubscription();
      }
    }, 60000); // Vérifier chaque minute
    
    // Synchroniser au retour sur la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current && !syncInProgress.current) {
        syncSubscription(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
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
