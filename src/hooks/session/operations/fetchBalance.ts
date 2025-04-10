
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useFetchBalance = (
  userId: string | undefined,
  setBalance: (balance: number) => void,
  setIsLoading: (isLoading: boolean) => void,
  setError: (error: string | null) => void
) => {
  const { toast } = useToast();

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

  return { fetchBalance };
};
