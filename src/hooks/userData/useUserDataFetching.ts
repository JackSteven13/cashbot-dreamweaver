
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';

export const useUserDataFetching = (
  loadUserProfile: (userId: string, userEmail?: string | null) => Promise<any>,
  loadUserBalance: (userId: string, isNewUser: boolean) => Promise<any>,
  updateUserData: (data: Partial<UserData>) => void,
  setIsLoading: (loading: boolean) => void,
  isNewUser: boolean
) => {
  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!supabase) return;
    
    setIsLoading(true);
    
    try {
      console.log("Fetching user data...");
      
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      
      if (!session || !session.user) {
        console.error("No active session found");
        setIsLoading(false);
        return;
      }
      
      const userId = session.user.id;
      
      // Load profile data
      const profileData = await loadUserProfile(userId, session.user.email);
      
      // Load balance data
      const balanceData = await loadUserBalance(userId, isNewUser);
      
      // Load transactions (with forced refresh)
      const transactions = await fetchUserTransactions(userId, true);
      
      // Update state with fetched data
      updateUserData({
        profile: profileData,
        ...balanceData,
        transactions
      });
      
      // Update last fetch timestamp
      localStorage.setItem('lastUserDataFetch', new Date().toISOString());

      console.log('User data loaded successfully:', { profileData, balanceData, transactions });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer vos données.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadUserProfile, loadUserBalance, updateUserData, setIsLoading, isNewUser]);
  
  // Reset daily counters
  const resetDailyCounters = useCallback(async () => {
    if (!supabase) return;
    
    try {
      console.log('Resetting daily counters');
      
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      
      if (!userId) return;
      
      // Update local state
      updateUserData({
        dailySessionCount: 0
      });
      
      // Update the database
      const { error } = await supabase
        .from('user_balances')
        .update({ daily_session_count: 0 })
        .eq('id', userId);
      
      if (error) {
        console.error('Error resetting daily counters:', error);
      }
      
      // Dispatch event to notify the app that daily counters were reset
      window.dispatchEvent(new CustomEvent('dailyGains:reset'));
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error resetting daily counters:', error);
    }
  }, [updateUserData]);
  
  return {
    fetchUserData,
    resetDailyCounters
  };
};

export default useUserDataFetching;
