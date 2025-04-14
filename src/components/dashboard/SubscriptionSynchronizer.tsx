
import { useEffect, useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { checkCurrentSubscription, forceSyncSubscription } from "@/hooks/payment/utils";

interface SubscriptionSynchronizerProps {
  onSync?: (subscription: string) => void;
}

/**
 * Composant invisible qui synchronise l'abonnement entre Supabase et le localStorage
 */
const SubscriptionSynchronizer = ({ onSync }: SubscriptionSynchronizerProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const isMounted = useRef(true);
  const lastSyncTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Synchroniser l'abonnement au chargement et périodiquement
  useEffect(() => {
    isMounted.current = true;
    const syncNow = async () => {
      if (!isMounted.current || isChecking) return;
      
      // Éviter les synchronisations trop fréquentes
      const now = Date.now();
      if (now - lastSyncTimeRef.current < 30000) return; // 30 secondes minimum entre les synchronisations
      
      setIsChecking(true);
      lastSyncTimeRef.current = now;
      
      try {
        // Vérifier si une synchronisation forcée est demandée
        const forceRefresh = localStorage.getItem('forceRefreshBalance') === 'true';
        
        if (forceRefresh) {
          console.log("Force refresh détecté, synchronisation complète");
          await forceSyncSubscription();
          localStorage.removeItem('forceRefreshBalance');
        } else {
          // Synchronisation standard
          const currentSub = await checkCurrentSubscription();
          if (currentSub) {
            const localSub = localStorage.getItem('subscription');
            if (currentSub !== localSub) {
              console.log(`Mise à jour de l'abonnement: ${localSub} -> ${currentSub}`);
              localStorage.setItem('subscription', currentSub);
              
              // Notifier le parent si callback fourni
              if (onSync && isMounted.current) {
                onSync(currentSub);
              }
              
              // Notifier l'utilisateur
              toast({
                title: "Abonnement synchronisé",
                description: `Votre abonnement ${currentSub} a été synchronisé avec succès.`,
                duration: 3000,
              });
              
              // Déclencher l'événement de mise à jour
              window.dispatchEvent(new CustomEvent('subscription:updated', { 
                detail: { subscription: currentSub } 
              }));
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la synchronisation:", error);
      } finally {
        if (isMounted.current) {
          setIsChecking(false);
        }
      }
    };
    
    // Synchroniser immédiatement
    syncNow();
    
    // Synchroniser périodiquement
    const intervalId = setInterval(syncNow, 60000); // Toutes les minutes
    
    // Écouter les changements de visibilité
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(syncNow, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onSync, isChecking]);
  
  // Le composant ne rend rien
  return null;
};

export default SubscriptionSynchronizer;
