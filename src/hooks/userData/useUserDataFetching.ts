
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserData } from '@/types/userData';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';

export const useUserDataFetching = (
  loadUserProfile: (userId: string) => Promise<any>,
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
      // Load profile data
      const profileData = await loadUserProfile(user.id);
      
      // Load balance data
      const balanceData = await loadUserBalance(user.id, isNewUser);
      
      // Load transactions
      const transactions = await fetchUserTransactions(user.id);
      
      // Update state with fetched data
      updateUserData({
        ...profileData,
        ...balanceData,
        transactions
      });
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
      // Reset the daily session count
      // This would typically be a database operation
      console.log('Resetting daily counters for user', user.id);
      
      // Update local state
      updateUserData({
        dailySessionCount: 0
      });
      
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
