
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { fetchUserTransactions, fetchCompleteUserData } from '@/utils/user/userDataFetch';
import { UserData, Transaction } from '@/types/userData';
import { getCurrentSession, checkDailyLimit } from '@/utils/authUtils';
import { initialUserData } from '@/utils/userDataInitializer';
import { useProfileLoader } from './useProfileLoader';
import { useBalanceLoader } from './useBalanceLoader';
import { generateReferralLink } from '@/utils/referralUtils';

export interface UserFetcherState {
  userData: UserData;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isLoading: boolean;
}

export interface UserFetcherActions {
  setShowLimitAlert: (show: boolean) => void;
  fetchUserData: () => Promise<void>;
}

export const useUserDataFetcher = (): [UserFetcherState, UserFetcherActions] => {
  const navigate = useNavigate();
  const [state, setState] = useState<UserFetcherState>({
    userData: initialUserData,
    isNewUser: false,
    dailySessionCount: 0,
    showLimitAlert: false,
    isLoading: true
  });

  const { loadUserProfile, isNewUser, setIsNewUser } = useProfileLoader();
  const { loadUserBalance } = useBalanceLoader(setIsNewUser);

  const fetchUserData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const session = await getCurrentSession();
      
      if (!session) {
        console.error("No session found");
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Get complete user data including referrals
      const userData = await fetchCompleteUserData(session.user.id, session.user.email);
      
      if (!userData || !userData.balance) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      // Get user profile
      const refreshedProfile = await loadUserProfile(session.user.id, session.user.email);
      
      // Get balance data
      const balanceResult = await loadUserBalance(session.user.id);
      if (!balanceResult) {
        setState(prev => ({ ...prev, isLoading: false }));
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
      
      setState({
        userData: newUserData,
        isNewUser: userData.isNewUser || isNewUser,
        dailySessionCount: newDailySessionCount,
        showLimitAlert: limitReached,
        isLoading: false
      });
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loadUserProfile, loadUserBalance, isNewUser, navigate]);

  const setShowLimitAlert = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showLimitAlert: show }));
  }, []);

  return [
    state,
    {
      setShowLimitAlert,
      fetchUserData
    }
  ];
};
