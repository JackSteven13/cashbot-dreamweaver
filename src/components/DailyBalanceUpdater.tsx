
import React, { useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import balanceManager from '@/utils/balance/balanceManager';
import { repairInconsistentData } from '@/utils/balance/storage/localStorageUtils';
import stableBalance from '@/utils/balance/stableBalance';
import { useBalanceSynchronization } from '@/hooks/balance/useBalanceSynchronization';
import { useBalanceStability } from '@/hooks/balance/useBalanceStability';
import { useBalanceEvents } from '@/hooks/balance/useBalanceEvents';

/**
 * Invisible component that helps manage periodic balance updates,
 * synchronize balance across the app, and maintain consistency
 */
const DailyBalanceUpdater: React.FC = () => {
  const { userData } = useUserData();
  const userId = userData?.profile?.id;

  const { syncWithDatabase } = useBalanceSynchronization(userData);
  const { checkBalanceStability } = useBalanceStability(userData);
  useBalanceEvents(userData);
  
  // Initialize balance values and stabilize for 10 seconds after page load
  useEffect(() => {
    if (userData?.balance) {
      const currentBalance = parseFloat(userData.balance.toString());
      if (!isNaN(currentBalance)) {
        const balanceString = currentBalance.toString();
        
        // Store all relevant balance values consistently
        if (userId) {
          localStorage.setItem(`currentBalance_${userId}`, balanceString);
          localStorage.setItem(`lastKnownBalance_${userId}`, balanceString);
          localStorage.setItem(`lastUpdatedBalance_${userId}`, balanceString);
          localStorage.setItem(`highest_balance_${userId}`, balanceString);
        } else {
          localStorage.setItem('currentBalance', balanceString);
          localStorage.setItem('lastKnownBalance', balanceString);
          localStorage.setItem('lastUpdatedBalance', balanceString);
          localStorage.setItem('highest_balance', balanceString);
        }
        
        balanceManager.forceBalanceSync(currentBalance, userId);
        stableBalance.setBalance(currentBalance);
      }
    }
    
    const stabilizationPeriod = setTimeout(() => {
      console.log("Balance stabilization period ended");
    }, 10000);
    
    return () => clearTimeout(stabilizationPeriod);
  }, [userData, userId]);
  
  // Periodically check and repair balance inconsistencies
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (userId) {
        repairInconsistentData(userId);
      } else {
        repairInconsistentData();
      }
      
      checkBalanceStability();
    }, 30000);
    
    return () => clearInterval(checkInterval);
  }, [userId, checkBalanceStability]);

  return null;
};

export default DailyBalanceUpdater;
