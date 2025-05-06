
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';

/**
 * Hook for fetching user data with better state management
 */
export const useUserDataFetching = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      console.error('No user ID found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedTransactions = await fetchUserTransactions(user.id);
      setTransactions(fetchedTransactions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
      setTransactions([]);
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    transactions,
    isLoading,
    error,
    refresh: fetchData,
  };
};

export default useUserDataFetching;
