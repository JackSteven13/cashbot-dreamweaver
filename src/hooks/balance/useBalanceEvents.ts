
import { useEffect } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceEvents = (userData: UserData | null) => {
  const userId = userData?.profile?.id;

  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      const amount = detail?.amount;
      
      if (amount && amount > 0) {
        const newBalance = (userData?.balance || 0) + amount;
        if (userId) {
          localStorage.setItem(`highest_balance_${userId}`, newBalance.toString());
        } else {
          localStorage.setItem('highest_balance', newBalance.toString());
        }
      }
    };
    
    const handleBalanceForceUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      const newBalance = detail?.newBalance;
      
      if (typeof newBalance === 'number' && newBalance > 0) {
        if (userData?.balance && newBalance < userData.balance) {
          console.warn(`Balance decreased: ${userData.balance}€ -> ${newBalance}€`);
          
          if (userData.balance - newBalance > 0.01) {
            const lastTransactionTime = parseInt(localStorage.getItem('lastTransactionTime') || '0');
            const now = Date.now();
            
            if (now - lastTransactionTime > 5000) {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('balance:force-update', {
                  detail: {
                    newBalance: userData.balance,
                    timestamp: Date.now(),
                    protected: true,
                    userId: userId
                  }
                }));
              }, 100);
            }
          }
        }
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleBalanceForceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleBalanceForceUpdate);
    };
  }, [userData, userId]);
};
