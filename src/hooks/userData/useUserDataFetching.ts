
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile } from '@/utils/user/profileUtils';
import { toast } from '@/components/ui/use-toast';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';
import balanceManager from '@/utils/balance/balanceManager';

export const useUserDataFetching = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserData = useCallback(async (userId: string) => {
    if (!userId) {
      console.error("No user ID provided for fetching data");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Fetch user profile
      const userProfile = await fetchUserProfile(userId);
      
      // Fetch balance from user_balances
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error("Error fetching user balance:", balanceError);
        throw balanceError;
      }
      
      // Synchronize with balance manager
      if (balanceData?.balance) {
        balanceManager.forceBalanceSync(balanceData.balance);
      }
      
      // Fetch transactions
      const transactions = await fetchUserTransactions(userId);
      
      const userData = {
        profile: userProfile,
        balance: balanceData?.balance || 0,
        subscription: balanceData?.subscription || 'freemium',
        id: userId,
        transactions: transactions || [],
        lastRefreshed: Date.now()
      };
      
      return userData;
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user data. Please try again later.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchUserData, isLoading };
};

export default useUserDataFetching;
