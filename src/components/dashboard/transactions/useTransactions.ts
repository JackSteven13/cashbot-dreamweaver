
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Transaction } from '@/types/userData';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useTransactions = (initialTransactions: Transaction[]) => {
  // États stables avec initialisation optimisée
  const [showAllTransactions, setShowAllTransactions] = useState(() => {
    try {
      const storedValue = localStorage.getItem('showAllTransactions');
      return storedValue === 'true';
    } catch {
      return false;
    }
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Références pour éviter les fuites de mémoire
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef(0);
  const transactionsCacheKey = useRef('cachedTransactions');
  const initialFetchDone = useRef(false);
  const eventHandlersSetupRef = useRef(false);
  const throttleTimerRef = useRef<number | null>(null);
  
  // Initialiser les transactions une seule fois
  useEffect(() => {
    if (!initialFetchDone.current && Array.isArray(initialTransactions)) {
      // Prioriser les transactions passées en props
      if (initialTransactions.length > 0) {
        setTransactions(initialTransactions);
        initialFetchDone.current = true;
        
        // Sauvegarder en cache seulement les transactions valides
        const validTx = initialTransactions.filter(tx => 
          tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date
        );
        
        if (validTx.length > 0) {
          try {
            localStorage.setItem(transactionsCacheKey.current, JSON.stringify(validTx));
          } catch (e) {
            console.error("Failed to cache transactions:", e);
          }
        }
      } else {
        // Essayer de restaurer depuis le cache si aucune transaction initiale
        try {
          const cachedData = localStorage.getItem(transactionsCacheKey.current);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTransactions(parsed);
              initialFetchDone.current = true;
            }
          }
        } catch (e) {
          console.error("Error restoring transactions from cache:", e);
        }
      }
    }
    
    return () => {
      initialFetchDone.current = false;
    };
  }, [initialTransactions]);
  
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
  }, []);
  
  // Sauvegarde des préférences utilisateur
  useEffect(() => {
    try {
      localStorage.setItem('showAllTransactions', showAllTransactions.toString());
    } catch (e) {
      console.error("Error saving showAllTransactions preference:", e);
    }
  }, [showAllTransactions]);
  
  // Nettoyage à la fin
  useEffect(() => {
    // Récupérer l'ID utilisateur pour le cache
    const setUserCacheKey = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user?.id) {
          transactionsCacheKey.current = `cachedTransactions_${data.session.user.id}`;
          
          // Essayer de restaurer les données spécifiques à l'utilisateur
          const userCache = localStorage.getItem(transactionsCacheKey.current);
          if (userCache && !initialFetchDone.current) {
            try {
              const parsed = JSON.parse(userCache);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTransactions(parsed);
              }
            } catch (e) {
              console.error("Error parsing user cache:", e);
            }
          }
        }
      } catch (e) {
        console.error("Failed to get user for cache key:", e);
      }
    };
    
    setUserCacheKey();
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);
  
  // Memoize les résultats pour éviter les re-rendus inutiles
  const { validTransactions, displayedTransactions, hiddenTransactionsCount } = useMemo(() => {
    // Ne traiter que les transactions valides
    const validTx = Array.isArray(transactions) ? 
      transactions.filter(tx => tx && (typeof tx.gain === 'number' || typeof tx.amount === 'number') && tx.date) : [];
    
    // Déterminer les transactions à afficher
    const displayedTx = showAllTransactions 
      ? validTx 
      : validTx.slice(0, 3);
    
    // Calculer combien de transactions sont masquées
    const hiddenCount = validTx.length > 3 && !showAllTransactions ? validTx.length - 3 : 0;
    
    return {
      validTransactions: validTx,
      displayedTransactions: displayedTx,
      hiddenTransactionsCount: hiddenCount
    };
  }, [transactions, showAllTransactions]);
  
  return {
    showAllTransactions,
    setShowAllTransactions,
    validTransactions,
    displayedTransactions,
    refreshKey,
    handleManualRefresh,
    hiddenTransactionsCount
  };
};
