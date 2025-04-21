
import { useAuthSession } from "./session/useAuthSession";
import { useSessionCount } from "./session/useSessionCount";
import { useBalanceOperations } from "./session/useBalanceOperations";
import { useUserDataRefresh } from "./session/useUserDataRefresh";
import { useState, useEffect } from 'react';
import { UserData } from '@/types/userData';

export const useUserSession = () => {
  const { session } = useAuthSession();
  const { incrementSessionCount } = useSessionCount();
  const { updateBalance, resetBalance } = useBalanceOperations();
  const { refreshUserData } = useUserDataRefresh();
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Initialize userData from localStorage on mount
  useEffect(() => {
    try {
      const cachedUsername = localStorage.getItem('lastKnownUsername');
      const cachedSubscription = localStorage.getItem('subscription');
      const cachedBalance = localStorage.getItem('lastKnownBalance');
      
      if (cachedUsername || cachedSubscription || cachedBalance) {
        setUserData({
          username: cachedUsername || 'Utilisateur',
          subscription: cachedSubscription || 'freemium',
          balance: cachedBalance ? parseFloat(cachedBalance) : 0,
          profile: { id: session?.user?.id },
          transactions: [],
          referrals: [],
          referralLink: ''
        });
      }
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
    }
  }, [session]);
  
  // Update userData when user:data-loaded event is fired
  useEffect(() => {
    const handleUserDataLoaded = (event: CustomEvent) => {
      const data = event.detail;
      if (data && (data.username || data.balance !== undefined)) {
        setUserData(prevData => ({
          ...prevData,
          username: data.username || prevData?.username || 'Utilisateur',
          balance: data.balance !== undefined ? data.balance : prevData?.balance || 0,
          subscription: data.subscription || prevData?.subscription || 'freemium',
          profile: { 
            ...prevData?.profile,
            id: session?.user?.id || prevData?.profile?.id 
          }
        }));
      }
    };
    
    window.addEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
    
    return () => {
      window.removeEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
    };
  }, [session]);

  return {
    session,
    userData,
    incrementSessionCount,
    updateBalance,
    resetBalance,
    refreshUserData
  };
};

// Re-export the BalanceUpdateResult interface for consumers
export type { BalanceUpdateResult } from "./session/useBalanceOperations";
