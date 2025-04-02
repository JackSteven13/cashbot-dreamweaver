
import { useCallback } from 'react';
import { fetchCompleteUserData } from '@/utils/user/userDataFetch';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';
import { checkDailyLimit } from '@/utils/subscription';
import { generateReferralLink } from '@/utils/referralUtils';
import { UserFetcherState } from './useUserDataState';
import { getCurrentSession } from '@/utils/auth/sessionUtils';
import { UserData } from '@/types/userData';

// Initial default user data
const defaultUserData: UserData = {
  username: 'utilisateur',
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

      // Generate a default referral link to show something immediately
      const defaultRefLink = generateReferralLink(session.user.id);
      const initialUsername = session.user.email ? session.user.email.split('@')[0] : 'utilisateur';
      
      // Update with quick minimal data to show something to the user
      updateUserData({
        userData: {
          ...defaultUserData,
          username: initialUsername,
          referralLink: defaultRefLink,
          email: session.user.email
        },
        isLoading: true
      });

      // Fetch all user data including referrals in parallel
      const userDataPromise = fetchCompleteUserData(session.user.id, session.user.email);
      
      // Try to fetch user profile in parallel - if this fails, we'll still have something to show
      const profilePromise = loadUserProfile(session.user.id, session.user.email);
      const balancePromise = loadUserBalance(session.user.id);
      
      // Wait for the data to arrive
      const [userData, refreshedProfile, balanceResult] = await Promise.allSettled([
        userDataPromise, 
        profilePromise, 
        balancePromise
      ]);
      
      // Now process results, showing the best data we have
      
      // Create a merged userData with whatever data we have
      const mergedUserData = {
        ...defaultUserData,
        username: refreshedProfile.status === 'fulfilled' && refreshedProfile.value?.full_name ? 
                  refreshedProfile.value.full_name : 
                  (session.user.user_metadata?.full_name || initialUsername),
        email: session.user.email,
        referralLink: userData.status === 'fulfilled' && userData.value?.referralLink ? 
                      userData.value.referralLink : defaultRefLink,
        referrals: userData.status === 'fulfilled' && userData.value?.referrals ? 
                   userData.value.referrals : [],
        balance: balanceResult.status === 'fulfilled' && balanceResult.value?.balanceData?.balance !== undefined ? 
                 balanceResult.value.balanceData.balance : 0,
        subscription: balanceResult.status === 'fulfilled' && balanceResult.value?.balanceData?.subscription ? 
                     balanceResult.value.balanceData.subscription : 'freemium'
      };
      
      // Try to fetch transactions - if this fails, just use empty array
      let transactionsData = [];
      try {
        transactionsData = await fetchUserTransactions(session.user.id) || [];
      } catch (txError) {
        console.error("Error fetching transactions:", txError);
      }
      
      mergedUserData.transactions = transactionsData;
      
      // Determine session count
      const newDailySessionCount = balanceResult.status === 'fulfilled' && 
                                 balanceResult.value?.balanceData?.daily_session_count !== undefined ? 
                                 balanceResult.value.balanceData.daily_session_count : 0;
      
      // Check if daily limit is reached
      const limitReached = checkDailyLimit(
        mergedUserData.balance, 
        mergedUserData.subscription
      );
      
      // Determine if this is a new user
      const isUserNew = (userData.status === 'fulfilled' && userData.value?.isNewUser) || 
                       (balanceResult.status === 'fulfilled' && balanceResult.value?.isUserNew) || 
                       isNewUser;
      
      // Update data with protection against loops
      updateUserData({
        userData: mergedUserData,
        isNewUser: isUserNew,
        dailySessionCount: newDailySessionCount,
        showLimitAlert: limitReached,
        isLoading: false
      });
      
      setIsLoading(false);
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
