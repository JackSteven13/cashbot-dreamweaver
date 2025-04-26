
import { useEffect } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceEvents = (userData: UserData | null) => {
  const userId = userData?.profile?.id;

  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      const amount = detail?.amount;
      const currentBalance = detail?.currentBalance || userData?.balance || 0;
      
      if (amount && amount > 0) {
        // Calculate new balance
        const newBalance = currentBalance + amount;
        
        // Update localStorage with the new balance
        if (userId) {
          localStorage.setItem(`highest_balance_${userId}`, newBalance.toFixed(2));
          localStorage.setItem(`currentBalance_${userId}`, newBalance.toFixed(2));
          localStorage.setItem(`lastKnownBalance_${userId}`, newBalance.toFixed(2));
        } else {
          localStorage.setItem('highest_balance', newBalance.toFixed(2));
          localStorage.setItem('currentBalance', newBalance.toFixed(2));
          localStorage.setItem('lastKnownBalance', newBalance.toFixed(2));
        }
        
        // Make sure balance manager is updated
        balanceManager.forceBalanceSync(newBalance, userId);
        
        console.log(`Balance updated from ${currentBalance} to ${newBalance} (+${amount})`);
      }
    };
    
    const handleBalanceForceUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      const newBalance = detail?.newBalance;
      const isProtected = detail?.protected;
      
      if (typeof newBalance === 'number' && newBalance > 0) {
        if (userData?.balance && newBalance < userData.balance && !isProtected) {
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
        } else {
          // Update localStorage with the forced new balance
          if (userId) {
            localStorage.setItem(`currentBalance_${userId}`, newBalance.toFixed(2));
            localStorage.setItem(`lastKnownBalance_${userId}`, newBalance.toFixed(2));
            
            // Update highest balance if necessary
            const currentHighest = parseFloat(localStorage.getItem(`highest_balance_${userId}`) || '0');
            if (newBalance > currentHighest) {
              localStorage.setItem(`highest_balance_${userId}`, newBalance.toFixed(2));
            }
          } else {
            localStorage.setItem('currentBalance', newBalance.toFixed(2));
            localStorage.setItem('lastKnownBalance', newBalance.toFixed(2));
            
            const currentHighest = parseFloat(localStorage.getItem('highest_balance') || '0');
            if (newBalance > currentHighest) {
              localStorage.setItem('highest_balance', newBalance.toFixed(2));
            }
          }
          
          // Make sure balance manager is synchronized
          balanceManager.forceBalanceSync(newBalance, userId);
          
          console.log(`Force updated balance to ${newBalance}€`);
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
