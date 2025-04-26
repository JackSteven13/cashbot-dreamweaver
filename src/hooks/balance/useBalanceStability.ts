
import { useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';
import stableBalance from '@/utils/balance/stableBalance';
import { toast } from '@/components/ui/use-toast';
import { repairInconsistentData } from '@/utils/balance/storage/localStorageUtils';

const TOLERANCE = 0.01; // €0.01 tolerance

export const useBalanceStability = (userData: UserData | null) => {
  const userId = userData?.profile?.id;
  const highestObservedBalance = useRef<number>(0);
  const stableBalanceRef = useRef<number>(0);

  const checkBalanceStability = () => {
    try {
      if (!userData) return;
      
      const currentBalance = balanceManager.getCurrentBalance();
      const systemStableBalance = stableBalance.getBalance();
      
      const referenceBalance = Math.max(
        highestObservedBalance.current,
        stableBalanceRef.current,
        systemStableBalance
      );
      
      if (currentBalance < referenceBalance) {
        console.warn(`Balance decreased: ${referenceBalance}€ -> ${currentBalance}€`);
        
        if (referenceBalance - currentBalance > TOLERANCE) {
          console.log(`Restoring balance to reference: ${currentBalance}€ → ${referenceBalance}€`);
          
          balanceManager.forceBalanceSync(referenceBalance, userId);
          
          if (userId) {
            localStorage.setItem(`currentBalance_${userId}`, referenceBalance.toString());
            localStorage.setItem(`lastKnownBalance_${userId}`, referenceBalance.toString());
            localStorage.setItem(`lastUpdatedBalance_${userId}`, referenceBalance.toString());
            localStorage.setItem(`highest_balance_${userId}`, referenceBalance.toString());
          } else {
            localStorage.setItem('currentBalance', referenceBalance.toString());
            localStorage.setItem('lastKnownBalance', referenceBalance.toString());
            localStorage.setItem('lastUpdatedBalance', referenceBalance.toString());
            localStorage.setItem('highest_balance', referenceBalance.toString());
          }
          
          stableBalance.setBalance(referenceBalance);
          
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: {
              newBalance: referenceBalance,
              timestamp: Date.now(),
              protected: true,
              userId: userId
            }
          }));
          
          repairInconsistentData(userId);
          
          const lastToastTime = parseInt(localStorage.getItem('lastBalanceToastTime') || '0');
          const now = Date.now();
          if (now - lastToastTime > 60000) {
            toast({
              title: "Balance protégé",
              description: "La stabilité de votre solde a été assurée.",
              duration: 3000
            });
            localStorage.setItem('lastBalanceToastTime', now.toString());
          }
        }
      } else if (currentBalance > referenceBalance) {
        highestObservedBalance.current = currentBalance;
        stableBalanceRef.current = currentBalance;
        
        if (userId) {
          localStorage.setItem(`highest_balance_${userId}`, currentBalance.toString());
        } else {
          localStorage.setItem('highest_balance', currentBalance.toString());
        }
        
        stableBalance.setBalance(currentBalance);
      }
    } catch (error) {
      console.error('Error checking balance stability:', error);
    }
  };

  useEffect(() => {
    if (userData?.balance) {
      const currentBalance = parseFloat(userData.balance.toString());
      if (!isNaN(currentBalance) && currentBalance > highestObservedBalance.current) {
        highestObservedBalance.current = currentBalance;
      }
      
      const userKey = userId ? `highest_balance_${userId}` : 'highest_balance';
      const storedHighest = localStorage.getItem(userKey);
      if (storedHighest) {
        const storedValue = parseFloat(storedHighest);
        if (!isNaN(storedValue) && storedValue > highestObservedBalance.current) {
          highestObservedBalance.current = storedValue;
        }
      }
      
      if (userId) {
        localStorage.setItem(`highest_balance_${userId}`, highestObservedBalance.current.toString());
      } else {
        localStorage.setItem('highest_balance', highestObservedBalance.current.toString());
      }
      
      stableBalanceRef.current = highestObservedBalance.current;
    }
  }, [userData, userId]);

  return { checkBalanceStability };
};
