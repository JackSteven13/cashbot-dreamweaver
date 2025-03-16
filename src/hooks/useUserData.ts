import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { checkDailyLimit } from '@/utils/subscriptionUtils';
import { supabase } from "@/integrations/supabase/client";
import { UserData } from '@/types/userData';
import { 
  fetchUserProfile, 
  fetchUserBalance, 
  fetchUserTransactions 
} from '@/utils/userDataUtils';
import { useUserSession } from './useUserSession';

export type { UserData };

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData>({
    username: '',
    balance: 0,
    subscription: 'freemium',
    referrals: [],
    referralLink: 'https://cashbot.com?ref=admin',
    transactions: []
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [dailySessionCount, setDailySessionCount] = useState(0);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { incrementSessionCount: incrementSession, updateBalance: updateUserBalance, resetBalance: resetUserBalance } = useUserSession();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error("No session found");
          setIsLoading(false);
          return;
        }

        const profileData = await fetchUserProfile(session.user.id, session.user.email);
        
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError);
          setIsLoading(false);
          return;
        }

        const balanceResult = await fetchUserBalance(session.user.id);
        
        if (!balanceResult) {
          setIsLoading(false);
          return;
        }
        
        const { data: balanceData, isNewUser: newUser } = balanceResult;
        
        if (newUser) {
          setIsNewUser(true);
          
          toast({
            title: "Bienvenue sur CashBot !",
            description: "Votre compte a été créé avec succès. Notre système est maintenant actif pour vous.",
          });
        }

        const transactionsData = await fetchUserTransactions(session.user.id);

        const displayName = profileData?.full_name || 
                          userData.user?.user_metadata?.full_name || 
                          (userData.user?.email ? userData.user.email.split('@')[0] : 'utilisateur');

        setUserData({
          username: displayName,
          balance: balanceData?.balance || 0,
          subscription: balanceData?.subscription || 'freemium',
          referrals: [],
          referralLink: `https://cashbot.com?ref=${session.user.id.substring(0, 8)}`,
          transactions: transactionsData ? transactionsData.map(t => ({
            date: t.date,
            gain: t.gain,
            report: t.report
          })) : []
        });

        setDailySessionCount(balanceData?.daily_session_count || 0);
        
        if (checkDailyLimit(balanceData?.balance || 0, balanceData?.subscription || 'freemium')) {
          setShowLimitAlert(true);
        }

      } catch (error) {
        console.error("Error in fetchUserData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const incrementSessionCount = async () => {
    const newCount = await incrementSession(dailySessionCount);
    if (typeof newCount === 'number') {
      setDailySessionCount(newCount);
    }
  };

  const updateBalance = async (gain: number, report: string) => {
    const result = await updateUserBalance(gain, report);
    
    if (result.success) {
      setUserData(prev => ({
        ...prev,
        balance: result.newBalance || prev.balance,
        transactions: result.transaction ? [
          result.transaction,
          ...prev.transactions
        ] : prev.transactions
      }));
      
      if (result.limitReached) {
        setShowLimitAlert(true);
      }
    }
  };

  const resetBalance = async () => {
    const result = await resetUserBalance();
    
    if (result.success) {
      setUserData(prev => ({
        ...prev,
        balance: 0,
        transactions: result.transaction ? [
          result.transaction,
          ...prev.transactions
        ] : prev.transactions
      }));
    }
  };

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading
  };
};
