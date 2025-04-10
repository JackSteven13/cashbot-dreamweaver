
import { useState, useEffect } from 'react';
import { useAuthSession } from './useAuthSession';
import { useFetchBalance } from './operations/fetchBalance';
import { useUpdateBalance } from './operations/updateBalance';
import { useResetBalance } from './operations/resetBalance';
import { BalanceOperationsProps } from './types/balanceTypes';

export type { BalanceUpdateResult } from './types/balanceTypes';

export const useBalanceOperations = ({ userId, initialBalance = 0 }: BalanceOperationsProps) => {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuthSession();

  // Use our modular hooks
  const { fetchBalance } = useFetchBalance(userId, setBalance, setIsLoading, setError);
  const { updateBalance } = useUpdateBalance(userId, balance, setBalance, setIsLoading, setError, session);
  const { resetBalance } = useResetBalance(userId, balance, setBalance, setIsLoading, setError);

  useEffect(() => {
    if (userId) {
      fetchBalance();
    }
  }, [userId]);

  return {
    balance,
    isLoading,
    error,
    fetchBalance,
    updateBalance,
    resetBalance
  };
};

export default useBalanceOperations;
