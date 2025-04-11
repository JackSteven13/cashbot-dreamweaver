
import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour gérer le stockage et la restauration des transactions
 */
export const useTransactionsStorage = () => {
  // Références pour le cache et le statut de chargement
  const transactionsCacheKey = useRef('cachedTransactions');
  const initialFetchDone = useRef(false);
  
  // Fonction pour restaurer les transactions depuis le cache
  const restoreFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(transactionsCacheKey.current);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error restoring transactions from cache:", e);
    }
    return [];
  }, []);
  
  // Effet pour configurer la clé de cache spécifique à l'utilisateur
  useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.id) {
        transactionsCacheKey.current = `cachedTransactions_${data.session.user.id}`;
      }
    } catch (e) {
      console.error("Failed to get user for cache key:", e);
    }
  }, [])();
  
  return {
    transactionsCacheKey,
    initialFetchDone,
    restoreFromCache
  };
};
