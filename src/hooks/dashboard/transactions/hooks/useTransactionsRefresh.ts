
import { useCallback, useRef, MutableRefObject } from 'react';
import { Transaction } from '@/types/userData';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour gérer le rafraîchissement des transactions
 */
export const useTransactionsRefresh = (
  transactions: Transaction[],
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
  refreshKey: number,
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
) => {
  const isMountedRef = useRef(true);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshAttemptRef = useRef(0);
  
  // Fonction pour rafraîchir manuellement les transactions
  const handleManualRefresh = useCallback(async () => {
    // Éviter les rafraîchissements trop fréquents
    const now = Date.now();
    if (now - lastRefreshAttemptRef.current < 2000) {
      console.log("Rafraîchissement trop fréquent, ignoré");
      return;
    }
    
    lastRefreshAttemptRef.current = now;
    
    try {
      // Déclencher l'événement de rafraîchissement
      window.dispatchEvent(new CustomEvent('transactions:refresh', { 
        detail: { manual: true, timestamp: now } 
      }));
      
      // Obtenir les données utilisateur actuelles
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      
      const userId = session.user.id;
      
      // Actualiser directement depuis la base de données
      const { data: txData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Erreur lors de la récupération des transactions:", error);
        return;
      }
      
      if (Array.isArray(txData) && txData.length > 0 && isMountedRef.current) {
        // Formater les données de transaction
        const formattedTransactions: Transaction[] = txData.map((tx: any) => ({
          id: tx.id,
          date: tx.created_at || tx.date,
          gain: tx.gain,
          amount: tx.gain,
          report: tx.report,
          type: tx.type || 'system'
        }));
        
        // Mettre à jour l'état
        setTransactions(formattedTransactions);
        setRefreshKey(now);
        
        // Mettre en cache les transactions
        try {
          const userId = session.user.id;
          localStorage.setItem(`transactions_${userId}`, JSON.stringify(formattedTransactions));
        } catch (err) {
          console.error("Erreur lors de la mise en cache des transactions:", err);
        }
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des transactions:", error);
    }
  }, [setTransactions, setRefreshKey]);
  
  return {
    handleManualRefresh,
    isMountedRef,
    throttleTimerRef
  };
};

export default useTransactionsRefresh;
