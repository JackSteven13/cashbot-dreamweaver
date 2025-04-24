
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useUserDataSync } from './useUserDataSync';

export const useDataRefresh = () => {
  const { syncUserData } = useUserDataSync();
  
  const refreshData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        console.error("No user ID found, cannot refresh data");
        return false;
      }
      
      const success = await syncUserData();
      return success;
    } catch (error) {
      console.error("Error refreshing data:", error);
      return false;
    }
  }, [syncUserData]);

  return refreshData;
};
