
import { useState, useEffect } from 'react';
import { UserData } from '@/types/userData';

export const useBalanceSynchronization = (userData: UserData | null, isNewUser: boolean) => {
  const [effectiveBalance, setEffectiveBalance] = useState(0);
  
  useEffect(() => {
    if (!userData) return;
    
    // For new users, always maintain zero balance
    if (isNewUser) {
      setEffectiveBalance(0);
      return;
    }
    
    // For existing users, use the balance from userData
    // or maintain the current effective balance if it's higher
    const newBalance = Math.max(userData.balance || 0, effectiveBalance);
    setEffectiveBalance(newBalance);
    
  }, [userData, isNewUser, effectiveBalance]);
  
  return { effectiveBalance };
};
