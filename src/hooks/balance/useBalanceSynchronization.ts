
import { useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const SYNC_INTERVAL = 30000; // 30 seconds
const TOLERANCE = 0.01; // €0.01 tolerance

export const useBalanceSynchronization = (userData: UserData | null) => {
  const userId = userData?.profile?.id;
  const lastDbSync = useRef<number>(Date.now() - SYNC_INTERVAL);
  const syncCounter = useRef<number>(0);

  const syncWithDatabase = async () => {
    if (!userId) return;
    
    try {
      const now = Date.now();
      if (now - lastDbSync.current < SYNC_INTERVAL) return;
      
      lastDbSync.current = now;
      
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

      const saveBalanceToStorage = (balance: number) => {
        // Explicitly convert balance to string with fixed precision
        const balanceString = balance.toFixed(2);
        
        if (userId) {
          localStorage.setItem(`highest_balance_${userId}`, balanceString);
          localStorage.setItem(`currentBalance_${userId}`, balanceString);
          localStorage.setItem(`lastKnownBalance_${userId}`, balanceString);
          localStorage.setItem(`lastUpdatedBalance_${userId}`, balanceString);
        } else {
          localStorage.setItem('highest_balance', balanceString);
          localStorage.setItem('currentBalance', balanceString);
          localStorage.setItem('lastKnownBalance', balanceString);
          localStorage.setItem('lastUpdatedBalance', balanceString);
        }
      };

      if (localBalance > dbBalance) {
        await supabase
          .from('user_balances')
          .update({ balance: localBalance })
          .eq('id', userId);
          
        saveBalanceToStorage(localBalance);
      } else if (dbBalance > localBalance && (dbBalance - localBalance) > TOLERANCE) {
        balanceManager.forceBalanceSync(dbBalance, userId);
        saveBalanceToStorage(dbBalance);
        
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: {
            newBalance: dbBalance,
            timestamp: Date.now(),
            userId
          }
        }));
      }
    } catch (error) {
      console.error('Error syncing balance with database:', error);
    }
  };

  useEffect(() => {
    const checkInterval = setInterval(() => {
      syncCounter.current += 1;
      if (syncCounter.current >= 3) {
        syncCounter.current = 0;
        syncWithDatabase();
      }
    }, SYNC_INTERVAL);
    
    return () => clearInterval(checkInterval);
  }, [userId]);

  return { syncWithDatabase };
};
