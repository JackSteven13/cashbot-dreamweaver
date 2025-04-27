
import { useCallback, useRef } from 'react';
import { Transaction } from '@/types/userData';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';
import { toast } from '@/components/ui/use-toast';

export const useTransactionsRefresh = (
  transactions: Transaction[], 
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
  refreshKey: number,
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
) => {
  const { user } = useAuth();
  const isMountedRef = useRef<boolean>(true);
  const throttleTimerRef = useRef<number | null>(null);
  
  const handleManualRefresh = useCallback(async (): Promise<void> => {
    // Protection against multiple calls
    if (throttleTimerRef.current) return Promise.resolve();
    
    try {
      if (!user?.id || !isMountedRef.current) return Promise.resolve();
      
      // Visual feedback
      toast({
        title: "Actualisation en cours",
        description: "Chargement des transactions...",
        duration: 2000,
      });
      
      // Limit to one call every 3 seconds
      throttleTimerRef.current = window.setTimeout(() => {
        throttleTimerRef.current = null;
      }, 3000);
      
      const refreshedTransactions = await fetchUserTransactions(user.id);
      if (refreshedTransactions && isMountedRef.current) {
        setTransactions(refreshedTransactions);
        setRefreshKey(Date.now());
        
        // Update cache
        try {
          localStorage.setItem(`cachedTransactions_${user.id}`, JSON.stringify(refreshedTransactions));
        } catch (e) {
          console.error("Failed to update transaction cache:", e);
        }
        
        toast({
          title: "Liste mise à jour",
          description: "Les transactions ont été actualisées.",
          duration: 3000,
        });
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing transactions:", error);
      if (isMountedRef.current) {
        toast({
          title: "Erreur",
          description: "Impossible de rafraîchir les transactions.",
          variant: "destructive",
          duration: 3000,
        });
      }
      return Promise.reject(error);
    }
  }, [user?.id, setTransactions, setRefreshKey]);
  
  return {
    handleManualRefresh,
    isMountedRef,
    throttleTimerRef
  };
};

export default useTransactionsRefresh;
