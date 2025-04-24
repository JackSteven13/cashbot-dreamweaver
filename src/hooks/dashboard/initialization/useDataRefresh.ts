
import { useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useUserDataSync } from './useUserDataSync';

export const useDataRefresh = () => {
  const mountedRef = useRef(true);
  const { syncUserData } = useUserDataSync({ mountedRef });
  
  const refreshData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        console.error("No user ID found, cannot refresh data");
        return false;
      }
      
      console.log("Forçage de la synchronisation des données utilisateur", userId);
      
      // Déclencher un événement de rafraîchissement pour l'interface
      window.dispatchEvent(new CustomEvent('data:refreshing', {
        detail: { userId, timestamp: Date.now() }
      }));
      
      const success = await syncUserData();
      
      if (success) {
        // Notification d'une synchronisation réussie
        window.dispatchEvent(new CustomEvent('data:refreshed', {
          detail: { userId, timestamp: Date.now() }
        }));
      }
      
      return success;
    } catch (error) {
      console.error("Error refreshing data:", error);
      return false;
    }
  }, [syncUserData]);

  return refreshData;
};

export default useDataRefresh;
