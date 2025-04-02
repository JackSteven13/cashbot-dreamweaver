
import { useCallback } from 'react';
import { fetchCompleteUserData } from '@/utils/user/userDataFetch';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';
import { checkDailyLimit } from '@/utils/subscription'; // Import from the correct folder
import { generateReferralLink } from '@/utils/referralUtils';
import { UserFetcherState } from './useUserDataState';
import { getCurrentSession } from '@/utils/auth/sessionUtils';
import { UserData } from '@/types/userData';

// Initial default user data
const defaultUserData: UserData = {
  username: '',
  balance: 0,
  subscription: 'freemium',
  transactions: [],
  referrals: [],
  referralLink: '',
};

export const useUserDataFetching = (
  loadUserProfile: (userId: string, userEmail?: string | null) => Promise<any>,
  loadUserBalance: (userId: string) => Promise<any>,
  updateUserData: (data: Partial<UserFetcherState>) => void,
  setIsLoading: (loading: boolean) => void,
  isNewUser: boolean
) => {
  // Function to fetch user data with protection against loops
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Update with minimal default data immediately to prevent undefined errors
      updateUserData({
        userData: defaultUserData,
        isLoading: true
      });
      
      // Check if a session exists
      const session = await getCurrentSession();
      
      if (!session) {
        console.error("No session found");
        // Even when no session is found, ensure we have valid data objects
        updateUserData({
          userData: defaultUserData,
          isLoading: false
        });
        setIsLoading(false);
        return;
      }

      // Fetch all user data including referrals
      const userData = await fetchCompleteUserData(session.user.id, session.user.email);
      
      if (!userData) {
        console.log("Could not fetch user data, using defaults");
        updateUserData({
          userData: defaultUserData,
          isLoading: false
        });
        setIsLoading(false);
        return;
      }
      
      // Fetch user profile
      const refreshedProfile = await loadUserProfile(session.user.id, session.user.email);
      
      // Fetch balance data
      const balanceResult = await loadUserBalance(session.user.id);
      if (!balanceResult) {
        console.log("Could not fetch balance data, using defaults");
        updateUserData({
          userData: {
            ...defaultUserData,
            username: refreshedProfile?.full_name || 
                     session.user.user_metadata?.full_name || 
                     (session.user.email ? session.user.email.split('@')[0] : 'utilisateur'),
            referralLink: userData.referralLink || generateReferralLink(session.user.id),
            email: session.user.email || undefined,
          },
          isLoading: false
        });
        setIsLoading(false);
        return;
      }
      
      const { balanceData } = balanceResult;

      // Fetch transactions
      const transactionsData = await fetchUserTransactions(session.user.id);

      // Determine display name for user
      const displayName = refreshedProfile?.full_name || 
                         session.user.user_metadata?.full_name || 
                         (session.user.email ? session.user.email.split('@')[0] : 'utilisateur');

      // Create user data object
      const newUserData = {
        username: displayName,
        balance: balanceData?.balance || 0,
        subscription: balanceData?.subscription || 'freemium',
        referrals: userData.referrals || [],
        referralLink: userData.referralLink || generateReferralLink(session.user.id),
        email: session.user.email || undefined,
        transactions: transactionsData || []
      };
      
      const newDailySessionCount = balanceData?.daily_session_count || 0;
      
      // Check if daily limit is reached
      const limitReached = checkDailyLimit(balanceData?.balance || 0, balanceData?.subscription || 'freemium');
      
      // Update data with protection against loops
      updateUserData({
        userData: newUserData,
        isNewUser: userData.isNewUser || isNewUser,
        dailySessionCount: newDailySessionCount,
        showLimitAlert: limitReached,
        isLoading: false
      });
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      // On error, still update with defaults to prevent undefined errors
      updateUserData({
        userData: defaultUserData,
        isLoading: false
      });
      setIsLoading(false);
    }
  }, [loadUserProfile, loadUserBalance, isNewUser, updateUserData, setIsLoading]);

  return {
    fetchUserData
  };
};
