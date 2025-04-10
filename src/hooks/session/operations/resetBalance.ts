
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { BalanceUpdateResult, Transaction } from '../types/balanceTypes';

export const useResetBalance = (
  userId: string | undefined,
  balance: number,
  setBalance: (balance: number) => void,
  setIsLoading: (isLoading: boolean) => void,
  setError: (error: string | null) => void
) => {
  const { toast } = useToast();

  const resetBalance = async (): Promise<BalanceUpdateResult> => {
    if (!userId) {
      console.error('User ID is required to reset balance');
      return { success: false };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convertir le nombre 0 en nombre pour Supabase
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

      const transaction: Transaction = {
        date: new Date().toISOString().split('T')[0],
        gain: -balance,
        report: `Retrait de ${balance.toFixed(2)}€`
      };

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          ...transaction
        });

      if (transactionError) {
        console.error('Error adding withdrawal transaction:', transactionError);
      }

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

  return { resetBalance };
};
