
import { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { cleanOtherUserData } from '@/utils/balance/balanceStorage';
import balanceManager from "@/utils/balance/balanceManager";
import { useUserDataSync } from './useUserDataSync';

export const useInitialDataLoad = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const initializedRef = useRef(false);
  const { syncUserData } = useUserDataSync();

  const initializeData = async (userId: string) => {
    if (initializedRef.current) return;
    setIsInitializing(true);
    
    try {
      console.log("Active session found, user ID:", userId);
      
      // Clean other users' data
      cleanOtherUserData(userId);
      
      // Clean generic data
      try {
        console.log("Cleaning generic localStorage data");
        localStorage.removeItem('currentBalance');
        localStorage.removeItem('lastKnownBalance');
        localStorage.removeItem('lastUpdatedBalance');
        localStorage.removeItem('lastKnownUsername');
        sessionStorage.removeItem('currentBalance');
        
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('lastKnownUsername_') && !key.includes(userId)) {
            console.log(`Removing other user's key: ${key}`);
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error('Error cleaning generic localStorage keys:', e);
      }
      
      console.log("Syncing user data for:", userId);
      const syncSuccess = await syncUserData();
      
      if (!syncSuccess) {
        console.log("Initial sync failed, retrying once...");
        setTimeout(async () => {
          await syncUserData();
          window.dispatchEvent(new CustomEvent('bot:status-change', {
            detail: { active: true, userId }
          }));
        }, 1000);
      } else {
        window.dispatchEvent(new CustomEvent('bot:status-change', {
          detail: { active: true, userId }
        }));
        
        const { data: userBalanceData } = await supabase
          .from('user_balances')
          .select('balance, daily_session_count')
          .eq('id', userId)
          .single();
        
        const isLikelyNewUser = !userBalanceData || 
                             (userBalanceData.balance === 0 && userBalanceData.daily_session_count === 0);
        
        if (isLikelyNewUser) {
          console.log("User detected as new, resetting balance");
          balanceManager.forceBalanceSync(0, userId);
        }
      }
      
      initializedRef.current = true;
    } finally {
      setIsInitializing(false);
    }
  };

  return { isInitializing, initializeData };
};
