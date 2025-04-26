
import React, { useEffect, useRef } from 'react';
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
  const initialSyncDone = useRef(false);
  const lastUpdateTime = useRef<number>(Date.now());
  const forceUpdateCounter = useRef<number>(0);

  const { syncWithDatabase } = useBalanceSynchronization(userData);
  const { checkBalanceStability } = useBalanceStability(userData);
  useBalanceEvents(userData);
  
  // Initialize balance values and stabilize for 10 seconds after page load
  useEffect(() => {
    if (userData?.balance && !initialSyncDone.current) {
      const currentBalance = parseFloat(userData.balance.toString());
      if (!isNaN(currentBalance)) {
        const balanceString = currentBalance.toFixed(2);
        
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
        
        initialSyncDone.current = true;
        console.log("Initial balance sync complete:", currentBalance);
      }
    }
    
    const stabilizationPeriod = setTimeout(() => {
      console.log("Balance stabilization period ended");
      // Force a sync with database after stabilization
      syncWithDatabase();
    }, 10000);
    
    return () => clearTimeout(stabilizationPeriod);
  }, [userData, userId, syncWithDatabase]);
  
  // Periodically check and repair balance inconsistencies
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (userId) {
        repairInconsistentData(userId);
      } else {
        repairInconsistentData();
      }
      
      checkBalanceStability();
      
      // More frequent sync with database to ensure balance is updated
      const now = Date.now();
      if (now - lastUpdateTime.current > 20000) { // Every 20 seconds
        syncWithDatabase();
        lastUpdateTime.current = now;
        
        // Forcer une mise à jour de l'interface toutes les 5 vérifications
        forceUpdateCounter.current += 1;
        if (forceUpdateCounter.current >= 5) {
          forceUpdateCounter.current = 0;
          
          // Obtenir la dernière valeur du balance manager
          const currentBalance = balanceManager.getCurrentBalance();
          
          // Forcer une mise à jour de l'UI
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: { 
              newBalance: currentBalance,
              animate: false,
              forceRefresh: true,
              timestamp: now,
              userId
            }
          }));
        }
      }
    }, 15000); // Shorter interval for more frequent checks
    
    return () => clearInterval(checkInterval);
  }, [userId, checkBalanceStability, syncWithDatabase]);
  
  // Listen for balance update events and trigger synchronization
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      
      if (amount && amount > 0) {
        // When balance increases, schedule a sync with the database
        setTimeout(() => {
          syncWithDatabase();
        }, 2000);
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
    };
  }, [syncWithDatabase]);

  return null;
};

export default DailyBalanceUpdater;
