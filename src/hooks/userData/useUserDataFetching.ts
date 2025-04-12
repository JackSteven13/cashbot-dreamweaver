
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';

export const useUserDataFetching = (
  loadProfile,
  loadBalance,
  updateUserData,
  setIsLoading,
  isNewUser
) => {
  const { user } = useAuth();
  const userId = user?.id;
  const lastFetchTimeRef = useRef(0);
  
  // Fetches all user data including profile, balance, and transactions
  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    
    // Throttling - prevent excessive API calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) {
      console.log('Throttling API calls - waiting...');
      return;
    }
    lastFetchTimeRef.current = now;
    
    try {
      setIsLoading(true);
      
      const profile = await loadProfile(userId, user?.email);
      if (!profile) {
        console.error("Failed to load user profile");
        return;
      }
      
      const { data: balance, isNewUser: newUser } = await loadBalance(userId);
      
      // Only load transactions for existing users
      const transactions = newUser ? [] : await fetchUserTransactions(userId);
      
      updateUserData({
        userData: {
          profile,
          balance: balance || 0,
          subscription: balance?.subscription || 'freemium',
          transactions: transactions || [],
          referrals: [],
          referralLink: '',
          dailySessionCount: balance?.daily_session_count || 0
        },
        isNewUser: newUser,
        dailySessionCount: balance?.daily_session_count || 0
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, user?.email, loadProfile, loadBalance, updateUserData, setIsLoading]);
  
  // Resets daily counters at midnight
  const resetDailyCounters = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('user_balances')
        .update({
          daily_session_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error("Error resetting daily counters:", error);
      }
      
      // Refresh data after reset
      await fetchUserData();
    } catch (error) {
      console.error("Error in resetDailyCounters:", error);
    }
  }, [userId, fetchUserData]);
  
  return {
    fetchUserData,
    resetDailyCounters
  };
};

export default useUserDataFetching;
