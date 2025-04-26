import React, { useEffect, useRef, useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SYNC_INTERVAL = 30000; // 30 seconds

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
  
  const lastValues = useRef<{
    balance: number,
    dailyGains: number,
    dbBalance: number | null
  }>({
    balance: 0,
    dailyGains: 0,
    dbBalance: null
  });
  
  // Initialize with current values
  useEffect(() => {
    if (userId) {
      lastValues.current = {
        balance: balanceManager.getCurrentBalance(),
        dailyGains: balanceManager.getDailyGains(),
        dbBalance: null
      };
      
      // Initial DB sync when component mounts
      syncWithDatabase(userId);
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
        if (currentLocalBalance > dbBalance + 0.01) {
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
        else if (dbBalance > currentLocalBalance + 0.01) {
          console.log(`DB balance (${dbBalance.toFixed(2)}) is higher than local (${currentLocalBalance.toFixed(2)}). Updating local.`);
          
          // Update local balance manager with DB value
          balanceManager.forceBalanceSync(dbBalance);
          
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
        
        // Count inconsistencies
        setInconsistencyCount(prev => prev + 1);
        
        // For rare/occasional inconsistencies, stabilize with a smoothed transition
        if (inconsistencyCount < 3) {
          const smoothedBalance = (lastValues.current.balance * 0.7) + (currentBalance * 0.3);
          balanceManager.forceBalanceSync(smoothedBalance);
          
          // Queue a database sync after stabilization
          pendingUpdates.current.push({
            timestamp: now,
            value: smoothedBalance
          });
        }
        // For persistent inconsistencies, force a full database sync
        else if (inconsistencyCount >= 3 && lastValues.current.dbBalance !== null) {
          console.warn('Multiple inconsistencies detected, forcing DB sync');
          balanceManager.forceBalanceSync(lastValues.current.dbBalance);
          
          toast({
            title: "Synchronisation",
            description: "Synchronisation de votre solde avec nos serveurs...",
            duration: 3000
          });
          
          // Reset inconsistency counter after action taken
          setInconsistencyCount(0);
          
          // Force immediate database sync
          syncWithDatabase(userId);
        }
      } else {
        lastValues.current.balance = currentBalance;
        
        // Reset inconsistency counter if things are stable
        if (inconsistencyCount > 0 && now - lastBalanceUpdate.current > 10000) {
          setInconsistencyCount(0);
        }
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
    
    // Check every second for inconsistencies
    const consistencyInterval = setInterval(checkBalanceConsistency, 1000);
    
    // Process pending updates every 5 seconds
    const pendingUpdateInterval = setInterval(processPendingUpdates, 5000);
    
    // Cleanup
    return () => {
      clearInterval(consistencyInterval);
      clearInterval(pendingUpdateInterval);
    }
  }, [userId, inconsistencyCount]);
  
  // Listen for balance:update events to track when balances are explicitly updated
  useEffect(() => {
    const handleBalanceUpdate = () => {
      lastBalanceUpdate.current = Date.now();
      lastValues.current.balance = balanceManager.getCurrentBalance();
      lastValues.current.dailyGains = balanceManager.getDailyGains();
    };
    
    // Listen for DB balance updates
    const handleDbBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number') {
        lastValues.current.dbBalance = newBalance;
      }
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate);
    window.addEventListener('db:balance-updated', handleDbBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate);
      window.removeEventListener('db:balance-updated', handleDbBalanceUpdate as EventListener);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default DailyBalanceUpdater;
