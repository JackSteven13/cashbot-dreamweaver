
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface SubscriptionSynchronizerProps {
  onSync?: (subscription: string) => void;
  forceCheck?: boolean;
}

/**
 * Composant invisible qui synchronise l'abonnement entre Supabase et le localStorage
 * avec une option pour forcer la vérification et une meilleure gestion des erreurs
 */
const SubscriptionSynchronizer = ({ onSync, forceCheck = false }: SubscriptionSynchronizerProps) => {
  const [lastChecked, setLastChecked] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const isMounted = useRef(true);
  
  // Fonction de synchronisation extraite pour pouvoir l'utiliser dans le cleanup
  const syncSubscription = useCallback(async (force: boolean = false) => {
    // Prevent multiple simultaneous checks
    if (isChecking || !isMounted.current) return;
    
    // Limit frequency of checks to reduce API load
    const now = Date.now();
    if (!force && !forceCheck && now - lastChecked < 30000 && syncAttempts > 3) {
      return;
    }
    
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !isMounted.current) {
        console.log("Pas de session active, utilisation des données locales");
        return;
      }
      
      setIsChecking(true);
      setLastChecked(now);
      setSyncAttempts(prev => prev + 1);
      
      // Get cached subscription from localStorage
      const cachedSubscription = localStorage.getItem('subscription');
      
      try {
        // Try getting the subscription directly first using a direct query with no-cache headers
        const { data: userData, error: directError } = await supabase
          .from('user_balances')
          .select('subscription')
          .eq('id', session.user.id)
          .maybeSingle({
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
        if (!isMounted.current) return;
          
        if (!directError && userData && userData.subscription) {
          if (cachedSubscription !== userData.subscription) {
            console.log(`Mise à jour directe de l'abonnement: ${cachedSubscription || 'aucun'} -> ${userData.subscription}`);
            localStorage.setItem('subscription', userData.subscription);
            
            if (onSync && isMounted.current) {
              onSync(userData.subscription);
            }
            
            // Reset error count on success
            setErrorCount(0);
          } else {
            console.log("Abonnement déjà synchronisé:", userData.subscription);
          }
          setIsChecking(false);
          return;
        }
        
        // If direct query fails, try with RPC as fallback
        if (directError && isMounted.current) {
          console.log("Fallback on RPC for subscription sync");
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_current_subscription', { 
              user_id: session.user.id 
            }, { 
              head: false, // Disable cache
              count: 'exact' as const
            });
          
          if (!isMounted.current) return;
          
          if (!rpcError && rpcData) {
            // If we succeeded in getting the subscription, check if it has changed
            if (cachedSubscription !== rpcData) {
              console.log(`Mise à jour de l'abonnement: ${cachedSubscription || 'aucun'} -> ${rpcData}`);
              localStorage.setItem('subscription', rpcData);
              
              if (onSync && isMounted.current) {
                onSync(rpcData);
              }
              
              // Reset error count on success
              setErrorCount(0);
            } else {
              console.log("Abonnement déjà synchronisé:", rpcData);
            }
          } else if (rpcError && isMounted.current) {
            // Increment error count
            const newErrorCount = errorCount + 1;
            setErrorCount(newErrorCount);
            
            // Only log detailed error if it's repeated
            if (newErrorCount > 2) {
              console.error("Erreur lors de la récupération RPC:", rpcError);
            }
            
            // If we have a cached subscription, use it
            if (cachedSubscription && isMounted.current) {
              console.log("Utilisation de l'abonnement en cache:", cachedSubscription);
              if (onSync) {
                onSync(cachedSubscription);
              }
            }
          }
        }
      } catch (error) {
        if (!isMounted.current) return;
        
        console.error("Erreur de synchronisation:", error);
        
        // Use cached value if we have network errors
        if (cachedSubscription && isMounted.current) {
          console.log("Utilisation de l'abonnement en cache après erreur:", cachedSubscription);
          if (onSync) {
            onSync(cachedSubscription);
          }
        }
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error("Erreur générale de synchronisation:", error);
    } finally {
      if (isMounted.current) {
        setIsChecking(false);
      }
    }
  }, [onSync, forceCheck, lastChecked, isChecking, errorCount, syncAttempts]);
  
  useEffect(() => {
    isMounted.current = true;
    
    // On first render, clear any stale force refresh flag
    const forceRefresh = localStorage.getItem('forceRefreshBalance');
    if (forceRefresh === 'true') {
      console.log("Force refresh flag detected on mount, clearing");
      localStorage.removeItem('forceRefreshBalance');
    }
    
    // Synchroniser immédiatement au montage
    syncSubscription(true);
    
    // Configurer un intervalle pour synchroniser périodiquement
    // Utilisez un intervalle plus long pour réduire les appels API
    const intervalId = setInterval(() => {
      if (isMounted.current) {
        syncSubscription();
      }
    }, 60000); // 60 secondes
    
    // Ajouter un event listener pour les changements de focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current) {
        // Re-synchroniser quand l'utilisateur revient sur la page
        syncSubscription(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncSubscription]);
  
  // Composant invisible
  return null;
};

export default SubscriptionSynchronizer;
