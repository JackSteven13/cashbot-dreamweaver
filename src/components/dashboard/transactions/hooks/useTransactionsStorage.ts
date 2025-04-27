
import { useRef, useCallback } from 'react';
import { Transaction } from '@/types/userData';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';

export const useTransactionsStorage = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  
  // Créer une clé de cache unique pour cet utilisateur
  const transactionsCacheKey = useRef<string>(`transactions_${userId}`);
  
  // Référence pour suivre si les transactions ont été initialisées
  const initialFetchDone = useRef<boolean>(false);
  
  // Fonction pour restaurer les transactions depuis le cache avec un mécanisme de rafraîchissement
  const restoreFromCache = useCallback(async () => {
    try {
      // Vérifier d'abord si nous avons un cache local
      const cachedData = localStorage.getItem(transactionsCacheKey.current);
      
      if (cachedData) {
        console.log("Cached transactions found, parsing...");
        const parsedTransactions = JSON.parse(cachedData) as Transaction[];
        
        if (Array.isArray(parsedTransactions) && parsedTransactions.length > 0) {
          console.log(`Restored ${parsedTransactions.length} transactions from cache`);
          initialFetchDone.current = true;
          return parsedTransactions;
        }
      }
      
      // Si nous n'avons pas de cache ou s'il est vide, et que nous avons un ID utilisateur,
      // essayons de récupérer les transactions depuis la base de données
      if (userId) {
        console.log("No cached transactions found, fetching from API...");
        const freshTransactions = await fetchUserTransactions(userId, true);
        
        if (freshTransactions && freshTransactions.length > 0) {
          console.log(`Fetched ${freshTransactions.length} transactions from API`);
          
          // Sauvegarder dans le cache
          try {
            localStorage.setItem(transactionsCacheKey.current, JSON.stringify(freshTransactions));
          } catch (e) {
            console.error("Failed to cache transactions:", e);
          }
          
          initialFetchDone.current = true;
          return freshTransactions;
        }
      }
      
      console.log("No transactions found in cache or API");
      return [];
    } catch (e) {
      console.error("Error restoring transactions from cache:", e);
      return [];
    }
  }, [userId]);
  
  return {
    transactionsCacheKey,
    initialFetchDone,
    restoreFromCache
  };
};

export default useTransactionsStorage;
