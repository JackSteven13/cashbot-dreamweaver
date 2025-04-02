
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';

/**
 * Hook pour synchroniser l'abonnement entre localStorage et Supabase
 * Résout les problèmes d'incohérence et assure que l'utilisateur voit toujours
 * le bon niveau d'abonnement
 */
export const useSubscriptionSync = () => {
  const [currentSubscription, setCurrentSubscription] = useState<PlanType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(0);
  
  // Fonction principale de synchronisation
  const syncSubscription = useCallback(async (force: boolean = false) => {
    try {
      const now = Date.now();
      // Ne pas synchroniser trop fréquemment sauf si forcé
      if (!force && now - lastSynced < 30000) { // 30 secondes minimum entre syncs
        return currentSubscription;
      }
      
      setIsLoading(true);
      
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("Aucun utilisateur connecté, synchronisation impossible");
        setIsLoading(false);
        return null;
      }
      
      // Récupérer l'abonnement depuis Supabase
      const { data, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
        
      if (error) {
        console.error("Erreur lors de la récupération de l'abonnement:", error);
        setIsLoading(false);
        return currentSubscription;
      }
      
      const supabaseSubscription = data?.subscription as PlanType | null;
      const localSubscription = localStorage.getItem('subscription') as PlanType | null;
      
      console.log(`Sync: Supabase=${supabaseSubscription}, Local=${localSubscription}`);
      
      // Cas 1: Les deux correspondent, tout va bien
      if (supabaseSubscription === localSubscription) {
        setCurrentSubscription(supabaseSubscription);
        setLastSynced(now);
        setIsLoading(false);
        return supabaseSubscription;
      }
      
      // Cas 2: Supabase a une valeur mais pas localStorage (ou différente)
      if (supabaseSubscription) {
        console.log(`Mise à jour du localStorage: ${localSubscription} -> ${supabaseSubscription}`);
        localStorage.setItem('subscription', supabaseSubscription);
        setCurrentSubscription(supabaseSubscription);
        setLastSynced(now);
        setIsLoading(false);
        return supabaseSubscription;
      }
      
      // Cas 3: localStorage a une valeur mais pas Supabase
      if (localSubscription && !supabaseSubscription) {
        console.log("Incohérence: localStorage a un abonnement mais pas Supabase");
        // On n'efface pas le localStorage dans ce cas pour éviter de perdre des données
      }
      
      setLastSynced(now);
      setIsLoading(false);
      return supabaseSubscription;
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
      setIsLoading(false);
      return currentSubscription;
    }
  }, [currentSubscription, lastSynced]);
  
  // Synchroniser au montage du composant
  useEffect(() => {
    syncSubscription(true);
    
    // Synchroniser périodiquement
    const intervalId = setInterval(() => {
      syncSubscription();
    }, 60000); // Toutes les 60 secondes
    
    // Synchroniser lorsque l'utilisateur revient sur la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSubscription(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncSubscription]);
  
  return {
    subscription: currentSubscription,
    isLoading,
    syncSubscription
  };
};
