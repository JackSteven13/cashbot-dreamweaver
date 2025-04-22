
import { useEffect, useState } from 'react';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceSync = (userData: any, isPreloaded: boolean) => {
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(Date.now());

  useEffect(() => {
    if (!isPreloaded && userData && userData.balance) {
      balanceManager.forceBalanceSync(userData.balance, userData.id || userData.profile?.id);
      
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          newBalance: userData.balance,
          timestamp: Date.now() 
        }
      }));
    }
  }, [userData, isPreloaded]);

  return { lastBalanceUpdate, setLastBalanceUpdate };
};
