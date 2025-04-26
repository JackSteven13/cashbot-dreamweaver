
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
  const highestObservedBalance = useRef<number>(0);
  
  // Initialize the highest observed balance
  useEffect(() => {
    if (userData?.balance) {
      const currentBalance = parseFloat(userData.balance.toString());
      if (!isNaN(currentBalance) && currentBalance > highestObservedBalance.current) {
        highestObservedBalance.current = currentBalance;
      }
      
      // Also check localStorage for highest values
      const storedHighest = localStorage.getItem('highest_balance');
      if (storedHighest) {
        const storedValue = parseFloat(storedHighest);
        if (!isNaN(storedValue) && storedValue > highestObservedBalance.current) {
          highestObservedBalance.current = storedValue;
        }
      }
      
      // Store highest value back to localStorage
      localStorage.setItem('highest_balance', highestObservedBalance.current.toString());
    }
  }, [userData]);
  
  // Periodically check and repair balance inconsistencies
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Force repair every minute
      repairInconsistentData();
      
      // Check for balance stability
      checkBalanceStability();
    }, 60000);
    
    return () => clearInterval(checkInterval);
  }, []);
  
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
          localStorage.setItem('highest_balance', highestObservedBalance.current.toString());
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
          localStorage.setItem('highest_balance', highestObservedBalance.current.toString());
        }
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
                    protected: true
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
  }, [userData]);
  
  // Sync with database periodically
  useEffect(() => {
    if (!userId) return;
    
    const syncInterval = setInterval(async () => {
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
          localStorage.setItem('highest_balance', dbBalance.toString());
        }
        
        // If local balance is higher than db, update database
        if (localBalance > dbBalance) {
          console.log(`Updating database balance: ${dbBalance} → ${localBalance}`);
          
          await supabase
            .from('user_balances')
            .update({ balance: localBalance, updated_at: new Date().toISOString() })
            .eq('id', userId);
        } 
        // If db balance is higher than local and difference is significant
        else if (dbBalance > localBalance && (dbBalance - localBalance) > TOLERANCE) {
          console.log(`Updating local balance from database: ${localBalance} → ${dbBalance}`);
          
          // Force update the local balance
          balanceManager.forceBalanceSync(dbBalance);
          
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: {
              newBalance: dbBalance,
              timestamp: Date.now()
            }
          }));
        }
      } catch (error) {
        console.error('Error syncing balance with database:', error);
      }
    }, SYNC_INTERVAL);
    
    return () => clearInterval(syncInterval);
  }, [userId]);
  
  // Function to check if balance is stable
  const checkBalanceStability = () => {
    try {
      if (!userData) return;
      
      const currentBalance = balanceManager.getCurrentBalance();
      const expectedBalance = userData.balance;
      const highestBalance = highestObservedBalance.current;
      
      // If balance is lower than highest observed
      if (currentBalance < highestBalance) {
        console.warn(`Balance decreased: ${highestBalance}€ -> ${currentBalance}€ (${highestBalance - currentBalance}€)`);
        
        // If significant decrease, restore to highest observed
        if (highestBalance - currentBalance > TOLERANCE) {
          console.log(`Restoring balance to highest observed: ${currentBalance}€ → ${highestBalance}€`);
          
          balanceManager.forceBalanceSync(highestBalance);
          
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: {
              newBalance: highestBalance,
              timestamp: Date.now(),
              protected: true
            }
          }));
          
          // Also run repair routine
          repairInconsistentData();
          
          // Show toast to user
          toast({
            title: "Balance protégé",
            description: "La stabilité de votre solde a été assurée.",
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error('Error checking balance stability:', error);
    }
  };

  // Component doesn't render anything visible
  return null;
};

export default DailyBalanceUpdater;
