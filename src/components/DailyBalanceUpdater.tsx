
import React, { useEffect, useRef } from 'react';
import { useUserData } from '@/hooks/useUserData';
import balanceManager from '@/utils/balance/balanceManager';

/**
 * Invisible component that helps manage periodic balance updates,
 * synchronize balance across the app, and maintain consistency
 */
const DailyBalanceUpdater: React.FC = () => {
  const { userData } = useUserData();
  const userId = userData?.profile?.id;
  const lastBalanceUpdate = useRef<number>(Date.now());
  const lastValues = useRef<{
    balance: number,
    dailyGains: number
  }>({
    balance: 0,
    dailyGains: 0
  });
  
  // Initialize with current values
  useEffect(() => {
    if (userId) {
      lastValues.current = {
        balance: balanceManager.getCurrentBalance(),
        dailyGains: balanceManager.getDailyGains()
      };
    }
  }, [userId]);
  
  // Monitor for inconsistent changes
  useEffect(() => {
    if (!userId) return;
    
    const checkBalanceConsistency = () => {
      const currentBalance = balanceManager.getCurrentBalance();
      const currentDailyGains = balanceManager.getDailyGains();
      const now = Date.now();
      
      // Check if balance changed in an unexpected way
      if (Math.abs(currentBalance - lastValues.current.balance) > 0.05 && 
          now - lastBalanceUpdate.current < 500) {
        console.warn(
          `Detected potentially inconsistent balance change: ` +
          `${lastValues.current.balance.toFixed(2)} -> ${currentBalance.toFixed(2)}`
        );
        
        // Stabilize the value by using a smoothed transition
        const smoothedBalance = (lastValues.current.balance * 0.7) + (currentBalance * 0.3);
        balanceManager.forceBalanceSync(smoothedBalance);
      } else {
        lastValues.current.balance = currentBalance;
      }
      
      // Check for inconsistent daily gains
      if (Math.abs(currentDailyGains - lastValues.current.dailyGains) > 0.1 && 
          now - lastBalanceUpdate.current < 500) {
        console.warn(
          `Detected potentially inconsistent daily gains change: ` +
          `${lastValues.current.dailyGains.toFixed(2)} -> ${currentDailyGains.toFixed(2)}`
        );
        
        // Stabilize using smoothed transition
        const smoothedGains = (lastValues.current.dailyGains * 0.7) + (currentDailyGains * 0.3);
        balanceManager.setDailyGains(smoothedGains);
      } else {
        lastValues.current.dailyGains = currentDailyGains;
      }
      
      lastBalanceUpdate.current = now;
    };
    
    // Check every second for inconsistencies
    const intervalId = setInterval(checkBalanceConsistency, 1000);
    
    // Cleanup
    return () => clearInterval(intervalId);
  }, [userId]);
  
  // Listen for balance:update events to track when balances are explicitly updated
  useEffect(() => {
    const handleBalanceUpdate = () => {
      lastBalanceUpdate.current = Date.now();
      lastValues.current.balance = balanceManager.getCurrentBalance();
      lastValues.current.dailyGains = balanceManager.getDailyGains();
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate);
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default DailyBalanceUpdater;
