
import React, { useEffect, useRef, useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { repairInconsistentData } from '@/utils/balance/storage/localStorageUtils';

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
  const isSyncing = useRef<boolean>(false);
  const pendingUpdates = useRef<{timestamp: number, value: number}[]>([]);
  
  // State to keep track of consecutive inconsistent updates
  const [inconsistencyCount, setInconsistencyCount] = useState<number>(0);
  const consecutiveDecreases = useRef<number>(0);
  
  const lastValues = useRef<{
    balance: number,
    dailyGains: number,
    dbBalance: number | null,
    lastBalanceChangeDirection: 'increase' | 'decrease' | null,
    lastChangeAmount: number
  }>({
    balance: 0,
    dailyGains: 0,
    dbBalance: null,
    lastBalanceChangeDirection: null,
    lastChangeAmount: 0
  });
  
  // Initialize with current values
  useEffect(() => {
    if (userId) {
      // Initialize balance tracking values
      const currentBalance = balanceManager.getCurrentBalance();
      
      lastValues.current = {
        balance: currentBalance,
        dailyGains: balanceManager.getDailyGains(),
        dbBalance: null,
        lastBalanceChangeDirection: null,
        lastChangeAmount: 0
      };
      
      // Initial DB sync when component mounts
      syncWithDatabase(userId);
      
      // Also run initial data repair
      repairInconsistentData();
      
      console.log(`DailyBalanceUpdater initialized with balance: ${currentBalance.toFixed(2)}€`);
    }
  }, [userId]);
  
  // Periodic database synchronization
  useEffect(() => {
    if (!userId) return;
    
    const syncInterval = setInterval(() => {
      const now = Date.now();
      
      // Only sync if enough time has passed since last sync
      if (now - lastDbSync.current >= SYNC_INTERVAL && !isSyncing.current) {
        syncWithDatabase(userId);
      }
    }, SYNC_INTERVAL);
    
    return () => clearInterval(syncInterval);
  }, [userId]);
  
  // Function to sync with database
  const syncWithDatabase = async (userId: string) => {
    if (isSyncing.current) return;
    
    try {
      isSyncing.current = true;
      
      // Get balance from database
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Failed to sync with database:', error);
        return;
      }
      
      if (data && typeof data.balance === 'number') {
        const dbBalance = parseFloat(data.balance.toFixed(2));
        const currentLocalBalance = balanceManager.getCurrentBalance();
        
        // Store DB balance for reference
        lastValues.current.dbBalance = dbBalance;
        
        // If local balance is significantly higher, update DB
        if (currentLocalBalance > dbBalance + TOLERANCE) {
          console.log(`Local balance (${currentLocalBalance.toFixed(2)}) is higher than DB (${dbBalance.toFixed(2)}). Updating DB.`);
          
          // Only update DB if the difference is significant
          await supabase
            .from('user_balances')
            .update({ 
              balance: currentLocalBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          window.dispatchEvent(new CustomEvent('db:balance-updated', {
            detail: { newBalance: currentLocalBalance }
          }));
        }
        // If DB balance is higher, update local
        else if (dbBalance > currentLocalBalance + TOLERANCE) {
          console.log(`DB balance (${dbBalance.toFixed(2)}) is higher than local (${currentLocalBalance.toFixed(2)}). Updating local.`);
          
          // Update local balance manager with DB value
          balanceManager.forceBalanceSync(dbBalance);
          
          // Reset inconsistency tracking after a database sync
          setInconsistencyCount(0);
          consecutiveDecreases.current = 0;
          
          // Dispatch event for UI updates
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: { newBalance: dbBalance }
          }));
        }
        // If balances match within tolerance, no action needed
        else {
          console.log(`Balances are in sync: DB=${dbBalance.toFixed(2)}, Local=${currentLocalBalance.toFixed(2)}`);
        }
      }
      
      lastDbSync.current = Date.now();
    } catch (e) {
      console.error('Error during database sync:', e);
    } finally {
      isSyncing.current = false;
    }
  };
  
  // Monitor for unexpected balance decreases
  useEffect(() => {
    if (!userId) return;
    
    const checkBalanceStability = () => {
      const currentBalance = balanceManager.getCurrentBalance();
      const currentDailyGains = balanceManager.getDailyGains();
      const now = Date.now();
      
      // Skip very recent updates (within 500ms) to allow animations to complete
      if (now - lastBalanceUpdate.current < 500) {
        return;
      }
      
      // Calculate change since last check
      const balanceChange = currentBalance - lastValues.current.balance;
      const changeDirection = balanceChange > 0 ? 'increase' : 
                              balanceChange < 0 ? 'decrease' : null;
      
      // If balance DECREASED unexpectedly, track it
      if (changeDirection === 'decrease') {
        const decreaseAmount = Math.abs(balanceChange);
        
        // Log all decreases for tracking
        console.warn(
          `Balance decreased: ${lastValues.current.balance.toFixed(2)}€ -> ${currentBalance.toFixed(2)}€ ` +
          `(${decreaseAmount.toFixed(2)}€)`
        );
        
        // Count consecutive decreases
        consecutiveDecreases.current++;
        
        // If we have multiple consecutive decreases, take action
        if (consecutiveDecreases.current >= 2) {
          console.error(`Multiple consecutive balance decreases detected (${consecutiveDecreases.current})`);
          
          // Get the historical balance from DB or localStorage backup
          const dbBalance = lastValues.current.dbBalance;
          const backupBalance = localStorage.getItem('lastKnownBalance_backup');
          const backupBalanceNum = backupBalance ? parseFloat(backupBalance) : null;
          
          // Choose the highest reliable balance source
          let correctedBalance: number;
          
          if (dbBalance !== null && backupBalanceNum !== null) {
            correctedBalance = Math.max(dbBalance, backupBalanceNum);
          } else if (dbBalance !== null) {
            correctedBalance = dbBalance;
          } else if (backupBalanceNum !== null) {
            correctedBalance = backupBalanceNum;
          } else {
            // If no reliable source, add back the last decrease as a fallback
            correctedBalance = currentBalance + decreaseAmount;
          }
          
          // Ensure we're not going LOWER than current
          correctedBalance = Math.max(correctedBalance, currentBalance);
          
          // Force a balance correction
          console.log(`Correcting balance: ${currentBalance.toFixed(2)}€ -> ${correctedBalance.toFixed(2)}€`);
          balanceManager.forceBalanceSync(correctedBalance, userId);
          
          // Show a subtle toast notification for transparency
          if (consecutiveDecreases.current >= 3) {
            toast({
              title: "Synchronisation",
              description: "Synchronisation de votre solde avec nos serveurs...",
              duration: 2000
            });
          }
          
          // Reset tracking after correcting
          setInconsistencyCount(prev => prev + 1);
          
          // Force immediate database sync if issues persist
          if (inconsistencyCount > 3) {
            syncWithDatabase(userId);
          }
        }
      } else if (changeDirection === 'increase') {
        // Reset consecutive decreases counter on legitimate increases
        consecutiveDecreases.current = 0;
      }
      
      // Store the current state for next comparison
      lastValues.current = {
        balance: currentBalance,
        dailyGains: currentDailyGains,
        dbBalance: lastValues.current.dbBalance,
        lastBalanceChangeDirection: changeDirection,
        lastChangeAmount: Math.abs(balanceChange)
      };
      
      lastBalanceUpdate.current = now;
    };
    
    // Process pending updates
    const processPendingUpdates = () => {
      const now = Date.now();
      
      // Process any pending updates that are older than 5 seconds
      const updatesToProcess = pendingUpdates.current.filter(update => 
        now - update.timestamp > 5000
      );
      
      if (updatesToProcess.length > 0 && userId && !isSyncing.current) {
        // Process the most recent update
        const latestUpdate = updatesToProcess[updatesToProcess.length - 1];
        
        // Remove all processed updates
        pendingUpdates.current = pendingUpdates.current.filter(update => 
          now - update.timestamp <= 5000
        );
        
        // Trigger database sync with the latest value
        syncWithDatabase(userId);
      }
    };
    
    // Check every 2 seconds for inconsistencies
    const stabilityInterval = setInterval(checkBalanceStability, 2000);
    
    // Process pending updates every 5 seconds
    const pendingUpdateInterval = setInterval(processPendingUpdates, 5000);
    
    // Cleanup
    return () => {
      clearInterval(stabilityInterval);
      clearInterval(pendingUpdateInterval);
    }
  }, [userId, inconsistencyCount]);
  
  // Listen for balance:update events to track when balances are explicitly updated
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const now = Date.now();
      lastBalanceUpdate.current = now;
      
      const newBalance = event.detail?.newBalance;
      
      if (typeof newBalance === 'number') {
        // Reset consecutive decreases on explicit updates
        consecutiveDecreases.current = 0;
        
        // Record the direction of change
        const balanceChange = newBalance - lastValues.current.balance;
        const changeDirection = balanceChange > 0 ? 'increase' : 
                                balanceChange < 0 ? 'decrease' : null;
                                
        // Update tracking state
        lastValues.current = {
          ...lastValues.current,
          balance: newBalance,
          dailyGains: balanceManager.getDailyGains(),
          lastBalanceChangeDirection: changeDirection,
          lastChangeAmount: Math.abs(balanceChange)
        };
        
        // Log explicit updates
        if (changeDirection) {
          console.log(`Explicit balance update: ${balanceChange > 0 ? '+' : ''}${balanceChange.toFixed(3)}€`);
        }
      }
    };
    
    // Listen for DB balance updates
    const handleDbBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number') {
        lastValues.current.dbBalance = newBalance;
      }
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('db:balance-updated', handleDbBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('db:balance-updated', handleDbBalanceUpdate as EventListener);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default DailyBalanceUpdater;
