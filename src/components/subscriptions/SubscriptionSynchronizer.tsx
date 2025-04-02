
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
  
  // Fonction de synchronisation extraite pour pouvoir l'utiliser dans le cleanup
  const syncSubscription = useCallback(async (force: boolean = false) => {
    // Éviter les appels simultanés qui peuvent causer des instabilités
    if (syncInProgress.current || !isMounted.current) {
      return;
    }
    
    try {
      syncInProgress.current = true;
      
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("Pas de session active, synchronisation ignorée");
        syncInProgress.current = false;
        return;
      }
      
      // Déterminer si on doit forcer une synchronisation
      const now = Date.now();
      const shouldForceSync = force || forceCheck || (now - lastChecked > 30000); // 30 secondes
      
      if (!shouldForceSync && !forceCheck) {
        syncInProgress.current = false;
        return;
      }
      
      setLastChecked(now);
      console.log("Synchronisation de l'abonnement depuis Supabase...");
      
      // Essayer d'abord la fonction RPC avec cache désactivé
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_current_subscription', { 
          user_id: session.user.id 
        }, { 
          head: false,
          count: 'exact' as const
        }) as { data: string | null, error: any };
        
      if (!rpcError && rpcData) {
        if (!isMounted.current) {
          syncInProgress.current = false;
          return;
        }
        
        // Vérifier si l'abonnement a changé
        const currentLocalSub = localStorage.getItem('subscription');
        if (currentLocalSub !== rpcData) {
          console.log(`Mise à jour de l'abonnement: ${currentLocalSub} -> ${rpcData}`);
          localStorage.setItem('subscription', rpcData);
          
          if (onSync && isMounted.current) {
            onSync(rpcData);
          }
          
          // Notification seulement si l'abonnement change d'un niveau non freemium à un autre
          if (isInitialized && currentLocalSub && currentLocalSub !== 'freemium' && currentLocalSub !== rpcData) {
            if (isMounted.current) {
              toast({
                title: "Abonnement mis à jour",
                description: `Votre abonnement est maintenant: ${rpcData.charAt(0).toUpperCase() + rpcData.slice(1)}`,
              });
            }
          }
        } else {
          console.log("Sync: Supabase=" + rpcData + ", Local=" + currentLocalSub);
        }
        
        // Réinitialiser le compteur de tentatives
        setRetryCount(0);
        setIsInitialized(true);
      } else {
        if (!isMounted.current) {
          syncInProgress.current = false;
          return;
        }
        
        // Fallback sur requête directe
        console.log("Échec RPC, tentative directe:", rpcError);
        
        const { data: userData, error: directError } = await supabase
          .from('user_balances')
          .select('subscription')
          .eq('id', session.user.id)
          .single();
          
        if (!directError && userData && userData.subscription) {
          const currentLocalSub = localStorage.getItem('subscription');
          if (currentLocalSub !== userData.subscription) {
            console.log(`Mise à jour directe de l'abonnement: ${currentLocalSub} -> ${userData.subscription}`);
            localStorage.setItem('subscription', userData.subscription);
            
            if (onSync && isMounted.current) {
              onSync(userData.subscription);
            }
          }
          
          // Réinitialiser le compteur de tentatives
          setRetryCount(0);
          setIsInitialized(true);
        } else if (retryCount < 3 && isMounted.current) {
          // Si les deux méthodes échouent, réessayer plus tard (max 3 fois)
          console.log(`Échec de synchronisation, nouvelle tentative prévue (${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
          
          // Tentative avec délai exponentiel
          setTimeout(() => {
            if (isMounted.current) {
              syncSubscription(true);
            }
          }, 2000 * Math.pow(2, retryCount));
        }
      }
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
      
      // Réessayer en cas d'erreur réseau ou de connexion
      if (retryCount < 3 && isMounted.current) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          if (isMounted.current) {
            syncSubscription(true);
          }
        }, 3000 * Math.pow(2, retryCount));
      }
    } finally {
      syncInProgress.current = false;
    }
  }, [onSync, forceCheck, lastChecked, retryCount, isInitialized]);
  
  useEffect(() => {
    isMounted.current = true;
    syncInProgress.current = false;
    
    // Synchroniser immédiatement au montage
    syncSubscription(true);
    
    // Configurer un intervalle pour synchroniser périodiquement
    const intervalId = setInterval(() => {
      if (isMounted.current && !syncInProgress.current) {
        syncSubscription();
      }
    }, 20000); // Vérifier toutes les 20 secondes
    
    // Ajouter un event listener pour les changements de focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current && !syncInProgress.current) {
        // Re-synchroniser quand l'utilisateur revient sur la page
        syncSubscription(true);
      }
    };
    
    // Ajouter un listener pour les changements de réseau
    const handleOnline = () => {
      if (isMounted.current && !syncInProgress.current) {
        console.log("Connexion réseau rétablie, tentative de synchronisation");
        syncSubscription(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [syncSubscription]);
  
  // Composant invisible
  return null;
};

export default SubscriptionSynchronizer;
