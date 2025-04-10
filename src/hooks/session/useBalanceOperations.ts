
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuthSession } from "./useAuthSession";

interface BalanceOperationsProps {
  userId?: string;
  initialBalance?: number;
}

export interface BalanceUpdateResult {
  success: boolean;
  newBalance?: number;
  limitReached?: boolean;
  transaction?: {
    date: string;
    gain: number;
    report: string;
  };
}

interface Transaction {
  date: string;
  gain: number;
  report: string;
}

export const useBalanceOperations = ({ userId, initialBalance = 0 }: BalanceOperationsProps) => {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { session } = useAuthSession();

  // Fetch initial balance when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchBalance();
    }
  }, [userId]);

  const fetchBalance = async (): Promise<void> => {
    if (!userId) {
      setError('User ID is required to fetch balance');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        setBalance(parseFloat(data.balance) || 0);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
      toast({
        title: 'Error',
        description: 'Failed to fetch your current balance',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBalance = async (
    gainAmount: number, 
    reportMessage: string, 
    forceUpdate = false
  ): Promise<BalanceUpdateResult> => {
    if (!userId) {
      console.error('User ID is required to update balance');
      return { success: false };
    }

    if (gainAmount === 0 && !forceUpdate) {
      console.log('No balance change, skipping update');
      return { success: true, newBalance: balance };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the JWT token from the session
      const token = session?.access_token;
      if (!token && !forceUpdate) {
        throw new Error('Authentication required');
      }

      // Update the balance in the database
      const { data: updatedBalance, error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          balance: balance + gainAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('balance')
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Create transaction object
      const transaction: Transaction = {
        date: new Date().toISOString().split('T')[0],
        gain: gainAmount,
        report: reportMessage
      };

      // Add a transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          ...transaction
        });

      if (transactionError) {
        console.error('Error adding transaction:', transactionError);
        // Continue even if transaction logging fails
      }

      // Update local state
      let newBalance = balance;
      if (updatedBalance) {
        newBalance = parseFloat(updatedBalance.balance) || 0;
        setBalance(newBalance);
      } else {
        // Fallback to local calculation if no data returned
        newBalance = balance + gainAmount;
        setBalance(newBalance);
      }

      return {
        success: true,
        newBalance,
        transaction
      };
    } catch (error) {
      console.error("Error updating balance:", error);
      setError('Failed to update balance');
      toast({
        title: 'Error',
        description: 'Failed to update your balance',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const resetBalance = async (): Promise<BalanceUpdateResult> => {
    if (!userId) {
      console.error('User ID is required to reset balance');
      return { success: false };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Reset the balance to 0 in the database
      const { error: resetError } = await supabase
        .from('user_balances')
        .update({ 
          balance: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (resetError) {
        throw new Error(resetError.message);
      }

      // Create withdrawal transaction
      const transaction: Transaction = {
        date: new Date().toISOString().split('T')[0],
        gain: -balance, // Negative amount for withdrawal
        report: `Retrait de ${balance.toFixed(2)}€`
      };

      // Add a withdrawal transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          ...transaction
        });

      if (transactionError) {
        console.error('Error adding withdrawal transaction:', transactionError);
        // Continue even if transaction logging fails
      }

      // Update local state
      setBalance(0);
      
      toast({
        title: 'Success',
        description: 'Your balance has been reset to 0',
        variant: 'default',
      });
      
      return { 
        success: true, 
        newBalance: 0,
        transaction
      };
    } catch (error) {
      console.error("Error resetting balance:", error);
      setError('Failed to reset balance');
      toast({
        title: 'Error',
        description: 'Failed to reset your balance',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

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
