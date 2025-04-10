
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { BalanceUpdateResult, Transaction } from '../types/balanceTypes';

export const useUpdateBalance = (
  userId: string | undefined,
  balance: number,
  setBalance: (balance: number) => void,
  setIsLoading: (isLoading: boolean) => void,
  setError: (error: string | null) => void,
  session?: any
) => {
  const { toast } = useToast();

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
      const token = session?.access_token;
      if (!token && !forceUpdate) {
        throw new Error('Authentication required');
      }

      const newBalanceValue = balance + gainAmount;
      
      // Convert numeric balance to string for Supabase
      const { data: updatedBalance, error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          balance: newBalanceValue.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('balance')
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const transaction: Transaction = {
        date: new Date().toISOString().split('T')[0],
        gain: gainAmount,
        report: reportMessage
      };

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          ...transaction
        });

      if (transactionError) {
        console.error('Error adding transaction:', transactionError);
      }

      let newBalance = balance;
      if (updatedBalance) {
        // Convert string balance to number
        newBalance = typeof updatedBalance.balance === 'string'
          ? parseFloat(updatedBalance.balance) || 0
          : updatedBalance.balance || 0;
        
        setBalance(newBalance);
      } else {
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

  return { updateBalance };
};
