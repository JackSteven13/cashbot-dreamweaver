
import { useCallback, useRef } from 'react';
import { toast } from "@/components/ui/use-toast";
import { verifyAuth, refreshSession } from "@/utils/auth";

export const useUserRefetching = (
  isMounted: React.MutableRefObject<boolean>,
  fetchUserData: () => Promise<void>
) => {
  const lastFetchTimestamp = useRef(0);
  const lastRefreshTimestamp = useRef(0);
  const fetchInProgress = useRef(false);
  
  const refetchUserData = useCallback(async (): Promise<boolean> => {
    // Prevent too frequent reloads
    const now = Date.now();
    if (now - lastFetchTimestamp.current < 5000) {
      console.log("Manual refetch rejected - too soon after last fetch");
      return false;
    }
    
    if (!isMounted.current || fetchInProgress.current) {
      return false;
    }
    
    console.log("Manual refetch requested");
    
    try {
      fetchInProgress.current = true;
      const isAuthValid = await verifyAuth();
      
      if (isAuthValid) {
        await fetchUserData();
        fetchInProgress.current = false;
        return true;
      } else {
        // Try refresh before giving up
        if (now - lastRefreshTimestamp.current > 30000) {
          lastRefreshTimestamp.current = now;
          const refreshed = await refreshSession();
          
          if (refreshed) {
            // Delay after refresh
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchUserData();
            fetchInProgress.current = false;
            return true;
          }
        }
        
        toast({
          title: "Problème d'authentification",
          description: "Impossible de rafraîchir vos données. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        fetchInProgress.current = false;
        return false;
      }
    } catch (error) {
      console.error("Error during manual refetch:", error);
      fetchInProgress.current = false;
      return false;
    }
  }, [fetchUserData, isMounted]);
  
  return {
    refetchUserData
  };
};
