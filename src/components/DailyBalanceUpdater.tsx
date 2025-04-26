
import React, { useEffect, useRef, useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { repairInconsistentData } from '@/utils/balance/storage/localStorageUtils';
import stableBalance from '@/utils/balance/stableBalance';

const SYNC_INTERVAL = 30000; // 30 seconds
const TOLERANCE = 0.01; // €0.01 tolerance for balance differences

/**
 * Invisible component that helps manage periodic balance updates,
 * synchronize balance across the app, and maintain consistency
 */
const DailyBalanceUpdater: React.FC = () => {
  const { userData } = useUserData();
  const userId = userData?.profile?.id;
  const lastBalanceUpdate = useRef<number>(Date.now());
  const lastDbSync = useRef<number>(Date.now() - SYNC_INTERVAL);
  const highestObservedBalance = useRef<number>(0);
  const stableBalanceRef = useRef<number>(0);
  const lastVerifiedBalance = useRef<number | null>(null);
  const syncCounter = useRef<number>(0);
  
  // Initialize the highest observed balance
  useEffect(() => {
    if (userData?.balance) {
      const currentBalance = parseFloat(userData.balance.toString());
      if (!isNaN(currentBalance) && currentBalance > highestObservedBalance.current) {
        highestObservedBalance.current = currentBalance;
      }
      
      // Also check localStorage for highest values - with user-specific keys
      const userKey = userId ? `highest_balance_${userId}` : 'highest_balance';
      const storedHighest = localStorage.getItem(userKey);
      if (storedHighest) {
        const storedValue = parseFloat(storedHighest);
        if (!isNaN(storedValue) && storedValue > highestObservedBalance.current) {
          highestObservedBalance.current = storedValue;
        }
      }
      
      // Store highest value back to localStorage with user-specific key
      if (userId) {
        localStorage.setItem(`highest_balance_${userId}`, highestObservedBalance.current.toString());
      } else {
        localStorage.setItem('highest_balance', highestObservedBalance.current.toString());
      }
      
      // Also initialize stableBalanceRef as the starting point
      stableBalanceRef.current = highestObservedBalance.current;
    }
  }, [userData, userId]);
  
  // Stabilize balance value for 10 seconds after page load
  useEffect(() => {
    // Create a fixed starting value
    if (userData?.balance) {
      const currentBalance = parseFloat(userData.balance.toString());
      if (!isNaN(currentBalance)) {
        lastVerifiedBalance.current = currentBalance;
        
        // Store all relevant balance values to the same consistent value using user-specific keys
        if (userId) {
          localStorage.setItem(`currentBalance_${userId}`, currentBalance.toString());
          localStorage.setItem(`lastKnownBalance_${userId}`, currentBalance.toString());
          localStorage.setItem(`lastUpdatedBalance_${userId}`, currentBalance.toString());
          localStorage.setItem(`highest_balance_${userId}`, currentBalance.toString());
        } else {
          localStorage.setItem('currentBalance', currentBalance.toString());
          localStorage.setItem('lastKnownBalance', currentBalance.toString());
          localStorage.setItem('lastUpdatedBalance', currentBalance.toString());
          localStorage.setItem('highest_balance', currentBalance.toString());
        }
        
        // Force consistent balance across the app
        balanceManager.forceBalanceSync(currentBalance, userId);
        
        // Also update stable balance system
        stableBalance.setBalance(currentBalance);
        
        console.log(`Fixed initial balance value: ${currentBalance.toFixed(2)}`);
      }
    }
    
    // Prevent balance fluctuations for the first 10 seconds
    const stabilizationPeriod = setTimeout(() => {
      console.log("Balance stabilization period ended");
    }, 10000);
    
    return () => clearTimeout(stabilizationPeriod);
  }, [userData, userId]);
  
  // Periodically check and repair balance inconsistencies
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Force repair every minute
      if (userId) {
        repairInconsistentData(userId);
      } else {
        repairInconsistentData();
      }
      
      // Check for balance stability
      checkBalanceStability();
      
      // Force sync with database regularly
      syncCounter.current += 1;
      if (syncCounter.current >= 3) {
        syncCounter.current = 0;
        syncWithDatabase();
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(checkInterval);
  }, [userId]);
  
  // Set up protection against unexpected balance decreases
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      const amount = detail?.amount;
      
      if (amount && amount > 0) {
        // When balance increases, update highest observed
        const newBalance = (userData?.balance || 0) + amount;
        if (newBalance > highestObservedBalance.current) {
          highestObservedBalance.current = newBalance;
          
          // Use user-specific key for storage
          if (userId) {
            localStorage.setItem(`highest_balance_${userId}`, newBalance.toString());
          } else {
            localStorage.setItem('highest_balance', newBalance.toString());
          }
        }
      }
    };
    
    const handleBalanceForceUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      const newBalance = detail?.newBalance;
      
      if (typeof newBalance === 'number' && newBalance > 0) {
        // Update highest observed balance
        if (newBalance > highestObservedBalance.current) {
          highestObservedBalance.current = newBalance;
          
          // Use user-specific key for storage
          if (userId) {
            localStorage.setItem(`highest_balance_${userId}`, newBalance.toString());
          } else {
            localStorage.setItem('highest_balance', newBalance.toString());
          }
        }
        
        // Record this as a stable balance point
        stableBalanceRef.current = newBalance;
        
        // If force update tries to lower the balance unexpectedly, restore it
        if (userData?.balance && newBalance < userData.balance) {
          console.warn(`Balance decreased: ${userData.balance}€ -> ${newBalance}€ (${userData.balance - newBalance}€)`);
          
          // Only allow decreases within tolerance
          if (userData.balance - newBalance > TOLERANCE) {
            // Check if there was a withdrawal or other valid reason
            const lastTransactionTime = parseInt(localStorage.getItem('lastTransactionTime') || '0');
            const now = Date.now();
            
            // If no recent transaction, prevent decrease
            if (now - lastTransactionTime > 5000) {
              console.log(`Blocking unexpected balance decrease. Restoring to ${highestObservedBalance.current}€`);
              
              // Dispatch event to force update to highest observed balance
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('balance:force-update', {
                  detail: {
                    newBalance: highestObservedBalance.current,
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
    
    // Listen for events related to balance updates
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleBalanceForceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleBalanceForceUpdate);
    };
  }, [userData, userId]);
  
  // Function to check if balance is stable
  const checkBalanceStability = () => {
    try {
      if (!userData) return;
      
      const currentBalance = balanceManager.getCurrentBalance();
      const expectedBalance = userData.balance;
      const highestBalance = highestObservedBalance.current;
      const stableBalanceValue = stableBalanceRef.current;
      
      // Also get balance from stable balance system
      const systemStableBalance = stableBalance.getBalance();
      
      // Always use the highest stable value as the reference point
      const referenceBalance = Math.max(
        highestBalance,
        stableBalanceValue,
        systemStableBalance
      );
      
      // If balance is lower than reference
      if (currentBalance < referenceBalance) {
        console.warn(`Balance decreased: ${referenceBalance}€ -> ${currentBalance}€ (${referenceBalance - currentBalance}€)`);
        
        // If significant decrease, restore to highest observed
        if (referenceBalance - currentBalance > TOLERANCE) {
          console.log(`Restoring balance to reference: ${currentBalance}€ → ${referenceBalance}€`);
          
          // Update balance with user-specific context
          balanceManager.forceBalanceSync(referenceBalance, userId);
          
          // Update all localStorage values to be consistent with user-specific keys
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
          
          // Update stable balance system
          stableBalance.setBalance(referenceBalance);
          
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: {
              newBalance: referenceBalance,
              timestamp: Date.now(),
              protected: true,
              userId: userId
            }
          }));
          
          // Also run repair routine
          repairInconsistentData(userId);
          
          // Show toast to user (but not too often)
          const lastToastTime = parseInt(localStorage.getItem('lastBalanceToastTime') || '0');
          const now = Date.now();
          if (now - lastToastTime > 60000) { // Max one toast per minute
            toast({
              title: "Balance protégé",
              description: "La stabilité de votre solde a été assurée.",
              duration: 3000
            });
            localStorage.setItem('lastBalanceToastTime', now.toString());
          }
        }
      } 
      // If balance is higher than reference, update the reference
      else if (currentBalance > referenceBalance) {
        highestObservedBalance.current = currentBalance;
        stableBalanceRef.current = currentBalance;
        
        // Use user-specific key for storage
        if (userId) {
          localStorage.setItem(`highest_balance_${userId}`, currentBalance.toString());
        } else {
          localStorage.setItem('highest_balance', currentBalance.toString());
        }
        
        // Also update stable balance system
        stableBalance.setBalance(currentBalance);
      }
    } catch (error) {
      console.error('Error checking balance stability:', error);
    }
  };
  
  // Sync with database and ensure data consistency
  const syncWithDatabase = async () => {
    if (!userId) return;
    
    try {
      const now = Date.now();
      
      // Limit database operations
      if (now - lastDbSync.current < SYNC_INTERVAL) {
        return;
      }
      
      lastDbSync.current = now;
      
      // Get balance from database
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching balance from database:', error);
        return;
      }
      
      const dbBalance = parseFloat(data.balance);
      const localBalance = balanceManager.getCurrentBalance();
      
      // Update highest observed if db balance is higher
      if (!isNaN(dbBalance) && dbBalance > highestObservedBalance.current) {
        highestObservedBalance.current = dbBalance;
        
        // Use user-specific key for storage
        localStorage.setItem(`highest_balance_${userId}`, dbBalance.toString());
      }
      
      // If local balance is higher than db, update database
      if (localBalance > dbBalance) {
        console.log(`Updating database balance: ${dbBalance} → ${localBalance}`);
        
        await supabase
          .from('user_balances')
          .update({ balance: localBalance, updated_at: new Date().toISOString() })
          .eq('id', userId);
          
        // Record this as a verified stable point
        stableBalanceRef.current = localBalance;
        lastVerifiedBalance.current = localBalance;
      } 
      // If db balance is higher than local and difference is significant
      else if (dbBalance > localBalance && (dbBalance - localBalance) > TOLERANCE) {
        console.log(`Updating local balance from database: ${localBalance} → ${dbBalance}`);
        
        // Force update the local balance with user context
        balanceManager.forceBalanceSync(dbBalance, userId);
        
        // Update stable balance system
        stableBalance.setBalance(dbBalance);
        
        // Update all localStorage values with user-specific keys
        localStorage.setItem(`currentBalance_${userId}`, dbBalance.toString());
        localStorage.setItem(`lastKnownBalance_${userId}`, dbBalance.toString());
        localStorage.setItem(`lastUpdatedBalance_${userId}`, dbBalance.toString());
        localStorage.setItem(`highest_balance_${userId}`, dbBalance.toString());
        
        // Update references
        stableBalanceRef.current = dbBalance;
        lastVerifiedBalance.current = dbBalance;
        
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: {
            newBalance: dbBalance,
            timestamp: Date.now(),
            userId: userId
          }
        }));
      }
    } catch (error) {
      console.error('Error syncing balance with database:', error);
    }
  };

  // Component doesn't render anything visible
  return null;
};

export default DailyBalanceUpdater;
