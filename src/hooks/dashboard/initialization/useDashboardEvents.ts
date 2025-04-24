
import { useEffect } from 'react';
import { UserData } from '@/types/userData';

export const useDashboardEvents = (
  setUsername: (name: string | null) => void,
  setSubscription: (sub: string | null) => void,
  setBalance: (balance: number | null) => void,
  setUserData: (data: UserData | null) => void
) => {
  useEffect(() => {
    const handleUserDataRefreshed = (event: any) => {
      const { username, subscription, balance, userData, isNewUser } = event.detail;
      if (username) setUsername(username);
      if (subscription) setSubscription(subscription);
      
      if (isNewUser) {
        setBalance(0);
      } else if (balance !== undefined) {
        setBalance(parseFloat(String(balance)));
      }
      
      if (userData) setUserData(userData);
    };
    
    window.addEventListener('user:refreshed', handleUserDataRefreshed);
    window.addEventListener('user:fast-init', handleUserDataRefreshed);
    
    return () => {
      window.removeEventListener('user:refreshed', handleUserDataRefreshed);
      window.removeEventListener('user:fast-init', handleUserDataRefreshed);
    };
  }, [setUsername, setSubscription, setBalance, setUserData]);
};
