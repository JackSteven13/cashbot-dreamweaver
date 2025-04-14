
import { useEffect, useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { checkCurrentSubscription, forceSyncSubscription, updateLocalSubscription } from "@/hooks/payment/utils";

interface SubscriptionSynchronizerProps {
  onSync?: (subscription: string) => void;
}

/**
 * Composant invisible qui synchronise l'abonnement entre Supabase et le localStorage
 */
const SubscriptionSynchronizer = ({ onSync }: SubscriptionSynchronizerProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const isMounted = useRef(true);
  const lastSyncTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Synchroniser l'abonnement avec gestion d'erreur améliorée
  const syncSubscription = async (force = false) => {
    if (!isMounted.current || isChecking) return;
    
    // Éviter les synchronisations trop fréquentes
    const now = Date.now();
    if (!force && now - lastSyncTimeRef.current < 30000) return; // 30 secondes entre syncs
    
    setIsChecking(true);
    lastSyncTimeRef.current = now;
    
    try {
      // Vérifier si une synchronisation forcée est demandée
      const forceRefresh = localStorage.getItem('forceRefreshBalance') === 'true';
      
      if (forceRefresh || force) {
        console.log("Force refresh détecté, synchronisation complète");
        const success = await forceSyncSubscription();
        
        if (success) {
          setSyncAttempts(0); // Réinitialisation des tentatives
          localStorage.removeItem('forceRefreshBalance');
        } else if (syncAttempts < 3) {
          // Retry with exponential backoff
          const nextAttempt = syncAttempts + 1;
          const delay = Math.min(2000 * Math.pow(2, nextAttempt), 30000);
          
          console.log(`Nouvelle tentative de sync (${nextAttempt}/3) dans ${delay}ms`);
          setSyncAttempts(nextAttempt);
          
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            syncSubscription(true);
          }, delay);
        } else {
          // After 3 failed attempts, show error and reset
          toast({
            title: "Problème de synchronisation",
            description: "Nous n'avons pas pu synchroniser votre abonnement après plusieurs tentatives. Veuillez rafraîchir la page.",
            variant: "destructive",
            duration: 6000,
          });
          setSyncAttempts(0);
        }
      } else {
        // Synchronisation standard
        const currentSub = await checkCurrentSubscription();
        if (currentSub) {
          const localSub = localStorage.getItem('subscription');
          if (currentSub !== localSub) {
            console.log(`Mise à jour de l'abonnement: ${localSub} -> ${currentSub}`);
            await updateLocalSubscription(currentSub);
            
            // Notifier le parent si callback fourni
            if (onSync && isMounted.current) {
              onSync(currentSub);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      
      if (syncAttempts < 3) {
        setSyncAttempts(prev => prev + 1);
      } else {
        setSyncAttempts(0);
      }
    } finally {
      if (isMounted.current) {
        setIsChecking(false);
      }
    }
  };
  
  // Effet pour gérer la synchronisation automatique et les nouvelles tentatives
  useEffect(() => {
    isMounted.current = true;
    
    // Synchroniser immédiatement
    syncSubscription(true);
    
    // Synchroniser lorsque la page devient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => syncSubscription(true), 1000);
      }
    };
    
    // Synchroniser périodiquement
    intervalRef.current = setInterval(() => syncSubscription(), 60000); // Toutes les minutes
    
    // Écouter les événements de paiement
    const handlePaymentSuccess = () => {
      console.log("Événement de paiement réussi détecté");
      // Forcer une synchronisation immédiate après un paiement réussi
      localStorage.setItem('forceRefreshBalance', 'true');
      syncSubscription(true);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('payment:success', handlePaymentSuccess);
    window.addEventListener('stripe:success', handlePaymentSuccess);
    
    return () => {
      isMounted.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('payment:success', handlePaymentSuccess);
      window.removeEventListener('stripe:success', handlePaymentSuccess);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onSync]);
  
  // Effet pour réagir aux changements de nombre de tentatives
  useEffect(() => {
    if (syncAttempts > 0 && syncAttempts < 3) {
      console.log(`Tentative de synchronisation ${syncAttempts}/3`);
    }
  }, [syncAttempts]);
  
  // Le composant ne rend rien
  return null;
};

export default SubscriptionSynchronizer;
