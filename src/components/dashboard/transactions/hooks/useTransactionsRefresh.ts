
import { useRef, useCallback } from 'react';
import { Transaction } from '@/types/userData';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook pour gérer le rafraîchissement des transactions
 */
export const useTransactionsRefresh = (
  transactions: Transaction[],
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
  refreshKey: number,
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
) => {
  // Références pour éviter les fuites de mémoire
  const isMountedRef = useRef(true);
  const throttleTimerRef = useRef<number | null>(null);
  const lastFetchRef = useRef(0);
  const transactionsCacheKey = useRef('cachedTransactions');
  
  // Gestionnaire d'actualisation pour éviter les appels API trop fréquents
  const handleManualRefresh = useCallback(async (): Promise<void> => {
    // Protection contre les appels multiples
    if (throttleTimerRef.current) return;
    
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      
      if (!session?.user?.id || !isMountedRef.current) return;
      
      // Feedback visuel
      toast({
        title: "Actualisation en cours",
        description: "Chargement des transactions...",
        duration: 2000,
      });
      
      // Limiter à un appel toutes les 3 secondes
      throttleTimerRef.current = window.setTimeout(() => {
        throttleTimerRef.current = null;
      }, 3000);
      
      const refreshedTransactions = await fetchUserTransactions(session.user.id);
      if (refreshedTransactions && isMountedRef.current) {
        setTransactions(refreshedTransactions);
        setRefreshKey(prev => prev + 1);
        
        // Mettre à jour le cache
        try {
          localStorage.setItem(transactionsCacheKey.current, JSON.stringify(refreshedTransactions));
        } catch (e) {
          console.error("Failed to update transaction cache:", e);
        }
        
        toast({
          title: "Liste mise à jour",
          description: "Les transactions ont été actualisées.",
          duration: 3000,
        });
      }
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
    }
  }, [setTransactions, setRefreshKey]);
  
  // Nettoyage des références à la fin
  useCallback(() => {
    return () => {
      isMountedRef.current = false;
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [])();
  
  return {
    handleManualRefresh,
    isMountedRef,
    throttleTimerRef,
    lastFetchRef,
    transactionsCacheKey
  };
};
