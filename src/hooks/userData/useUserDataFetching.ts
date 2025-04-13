
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserData } from '@/types/userData';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';

export const useUserDataFetching = (
  loadUserProfile: (userId: string, userEmail?: string | null) => Promise<any>,
  loadUserBalance: (userId: string, isNewUser: boolean) => Promise<any>,
  updateUserData: (data: Partial<UserData>) => void,
  setIsLoading: (loading: boolean) => void,
  isNewUser: boolean
) => {
  const { user } = useAuth();
  
  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      console.log("Fetching user data for:", user.id, user.email);
      
      // Load profile data
      const profileData = await loadUserProfile(user.id, user.email);
      
      // Load balance data
      const balanceData = await loadUserBalance(user.id, isNewUser);
      
      // Load transactions
      const transactions = await fetchUserTransactions(user.id);
      
      // Update state with fetched data
      updateUserData({
        profile: profileData,
        ...balanceData,
        transactions
      });

      // Dispatch event to activate the bot for newly connected users
      window.dispatchEvent(new CustomEvent('user:data-loaded', {
        detail: { 
          userId: user.id,
          isNewUser
        }
      }));

      console.log('User data loaded successfully:', { profileData, balanceData, transactions });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadUserProfile, loadUserBalance, updateUserData, setIsLoading, isNewUser]);
  
  // Reset daily counters
  const resetDailyCounters = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('Resetting daily counters for user', user.id);
      
      // Update local state
      updateUserData({
        dailySessionCount: 0
      });
      
      // Dispatch event to notify the app that daily counters were reset
      window.dispatchEvent(new CustomEvent('dailyGains:reset'));
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error resetting daily counters:', error);
    }
  }, [user, updateUserData]);
  
  return {
    fetchUserData,
    resetDailyCounters
  };
};

export default useUserDataFetching;
