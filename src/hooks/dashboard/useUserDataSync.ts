
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseUserDataSyncParams {
  mountedRef: React.RefObject<boolean>;
}

export const useUserDataSync = ({ mountedRef }: UseUserDataSyncParams) => {
  // Fonction pour synchroniser les données entre Supabase et le localStorage
  const syncUserData = useCallback(async () => {
    if (!mountedRef.current) return false;
    
    try {
      console.log("Syncing user data after authentication");
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session, skipping sync");
        return false;
      }
      
      // Attendre un peu pour être sûr que la session est bien établie
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { data: userBalanceData, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching subscription data:", error);
        return false;
      }
      
      if (!userBalanceData) {
        console.log("No user balance data found, may be a new user");
        return false;
      }
      
      // Mettre à jour le localStorage si nécessaire
      const localSubscription = localStorage.getItem('subscription');
      
      if (localSubscription !== userBalanceData.subscription) {
        console.log(`Syncing subscription: ${localSubscription} -> ${userBalanceData.subscription}`);
        localStorage.setItem('subscription', userBalanceData.subscription);
      }
      
      // Vérifier si une actualisation forcée a été demandée
      const forceRefresh = localStorage.getItem('forceRefreshBalance');
      if (forceRefresh === 'true') {
        console.log("Force refresh detected, clearing flag");
        localStorage.removeItem('forceRefreshBalance');
        return true; 
      }
      
      return true;
    } catch (error) {
      console.error("Error syncing user data:", error);
      return false;
    }
  }, [mountedRef]);

  return { syncUserData };
};
