
import { useRef, useCallback } from 'react';
import { Transaction } from '@/types/userData';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook pour gérer le rafraîchissement des transactions avec une meilleure gestion des dates
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
      
      // Forcer le rafraîchissement depuis la base de données
      const refreshedTransactions = await fetchUserTransactions(session.user.id, true);
      
      if (refreshedTransactions && isMountedRef.current) {
        // Mettre à jour l'état avec les transactions actualisées
        setTransactions(refreshedTransactions);
        setRefreshKey(prev => prev + 1);
        lastFetchRef.current = Date.now();
        
        toast({
          title: "Liste mise à jour",
          description: "Les transactions ont été actualisées.",
          duration: 3000,
        });
        
        // Vérifier si des transactions d'aujourd'hui sont présentes
        const today = new Date();
        const todayTransactions = refreshedTransactions.filter(tx => {
          try {
            if (!tx.date) return false;
            
            const txDate = new Date(tx.date);
            return (
              txDate.getFullYear() === today.getFullYear() &&
              txDate.getMonth() === today.getMonth() &&
              txDate.getDate() === today.getDate()
            );
          } catch (e) {
            console.error("Erreur lors de la vérification de la date:", e, tx.date);
            return false;
          }
        });
        
        if (todayTransactions.length === 0 && refreshedTransactions.length > 0) {
          console.warn("Aucune transaction d'aujourd'hui n'a été trouvée");
        } else {
          console.log(`${todayTransactions.length} transactions trouvées pour aujourd'hui`);
        }
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
