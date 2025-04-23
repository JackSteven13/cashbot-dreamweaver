
import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';

/**
 * Invisible component that handles background balance updates
 * This ensures that balance changes are persisted to the database
 */
const DailyBalanceUpdater: React.FC = () => {
  const { user } = useAuth();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Function to sync balance with the database
  const syncBalanceToDatabase = async () => {
    if (!user || isSyncingRef.current) return;
    
    try {
      isSyncingRef.current = true;
      const localBalance = balanceManager.getCurrentBalance();
      
      // Get the balance from the database
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching balance from database:', error);
        return;
      }
      
      const dbBalance = data?.balance || 0;
      
      // If local balance is higher, update the database
      if (localBalance > dbBalance) {
        console.log(`Syncing balance to database: ${dbBalance} -> ${localBalance}`);
        
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ 
            balance: localBalance,
            updated_at: new Date().toISOString() 
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating balance in database:', updateError);
        } else {
          console.log('Balance successfully synced to database');
        }
      } 
      // If database balance is higher, update locally
      else if (dbBalance > localBalance) {
        console.log(`Syncing balance from database: ${localBalance} -> ${dbBalance}`);
        balanceManager.forceBalanceSync(dbBalance);
        
        // Dispatch event to update UI components
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: { 
            newBalance: dbBalance,
            timestamp: Date.now(),
            userId: user.id
          }
        }));
      }
      
      // Dispatch a general sync event for other components to react
      window.dispatchEvent(new CustomEvent('balance:synced', {
        detail: { 
          timestamp: Date.now(),
          userId: user.id
        }
      }));
    } catch (err) {
      console.error('Error in syncBalanceToDatabase:', err);
    } finally {
      isSyncingRef.current = false;
    }
  };
  
  // Effect to handle balance syncing to the database
  useEffect(() => {
    if (user) {
      // Initial sync
      syncBalanceToDatabase();
      
      // Set up interval for periodic syncs
      syncIntervalRef.current = setInterval(syncBalanceToDatabase, 30000); // Every 30 seconds
      
      // Listen for specific events that should trigger a sync
      const handleBalanceUpdate = () => {
        // Add a small delay to allow other operations to complete
        setTimeout(syncBalanceToDatabase, 500);
      };
      
      window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.addEventListener('transactions:refresh', handleBalanceUpdate as EventListener);
      window.addEventListener('session:completed', handleBalanceUpdate as EventListener);
      
      // Listen for visibility changes to sync when the user returns to the app
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncBalanceToDatabase();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
        
        window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
        window.removeEventListener('transactions:refresh', handleBalanceUpdate as EventListener);
        window.removeEventListener('session:completed', handleBalanceUpdate as EventListener);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user]);

  return null; // This component doesn't render anything
};

export default DailyBalanceUpdater;
