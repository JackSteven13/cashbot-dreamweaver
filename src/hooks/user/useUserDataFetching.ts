
import { useCallback } from 'react';
import { fetchCompleteUserData } from '@/utils/user/userDataFetch';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';
import { checkDailyLimit } from '@/utils/auth';
import { generateReferralLink } from '@/utils/referralUtils';
import { UserFetcherState } from './useUserDataState';
import { getCurrentSession } from '@/utils/auth/sessionUtils';

export const useUserDataFetching = (
  loadUserProfile: (userId: string, userEmail?: string | null) => Promise<any>,
  loadUserBalance: (userId: string) => Promise<any>,
  updateUserData: (data: Partial<UserFetcherState>) => void,
  setIsLoading: (loading: boolean) => void,
  isNewUser: boolean
) => {

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const session = await getCurrentSession();
      
      if (!session) {
        console.error("No session found");
        setIsLoading(false);
        return;
      }

      // Get complete user data including referrals
      const userData = await fetchCompleteUserData(session.user.id, session.user.email);
      
      if (!userData || !userData.balance) {
        setIsLoading(false);
        return;
      }
      
      // Get user profile
      const refreshedProfile = await loadUserProfile(session.user.id, session.user.email);
      
      // Get balance data
      const balanceResult = await loadUserBalance(session.user.id);
      if (!balanceResult) {
        setIsLoading(false);
        return;
      }
      
      const { balanceData } = balanceResult;

      // Get transactions
      const transactionsData = await fetchUserTransactions(session.user.id);

      const displayName = refreshedProfile?.full_name || 
                         session.user.user_metadata?.full_name || 
                         (session.user.email ? session.user.email.split('@')[0] : 'utilisateur');

      const newUserData = {
        username: displayName,
        balance: balanceData?.balance || 0,
        subscription: balanceData?.subscription || 'freemium',
        referrals: userData.referrals || [],
        referralLink: userData.referralLink || generateReferralLink(session.user.id),
        email: session.user.email || undefined,
        transactions: transactionsData
      };
      
      const newDailySessionCount = balanceData?.daily_session_count || 0;
      
      const limitReached = checkDailyLimit(balanceData?.balance || 0, balanceData?.subscription || 'freemium');
      
      updateUserData({
        userData: newUserData,
        isNewUser: userData.isNewUser || isNewUser,
        dailySessionCount: newDailySessionCount,
        showLimitAlert: limitReached,
        isLoading: false
      });
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      setIsLoading(false);
    }
  }, [loadUserProfile, loadUserBalance, isNewUser, updateUserData, setIsLoading]);

  return {
    fetchUserData
  };
};
