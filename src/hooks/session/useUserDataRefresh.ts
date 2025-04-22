import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import balanceManager from '@/utils/balance/balanceManager';

export const useUserDataRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTime = useRef(0);
  const refreshDebounceTime = 1000; // 1 seconde minimum entre les rafraîchissements
  
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    if (now - lastRefreshTime.current < refreshDebounceTime) {
      console.log("Rafraîchissement demandé trop tôt, on attend...");
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      return new Promise((resolve) => {
        refreshTimeoutRef.current = setTimeout(async () => {
          const result = await refreshUserData();
          resolve(result);
        }, refreshDebounceTime - (now - lastRefreshTime.current));
      });
    }
    
    if (isRefreshing) {
      console.log("Rafraîchissement déjà en cours, ignoré");
      return false;
    }
    
    try {
      setIsRefreshing(true);
      lastRefreshTime.current = Date.now();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        setIsRefreshing(false);
        return false;
      }
      
      const userId = session.user.id;
      const userSpecificKeys = {
        username: `lastKnownUsername_${userId}`,
        subscription: `subscription_${userId}`,
        balance: `lastKnownBalance_${userId}`
      };
      
      const cachedName = localStorage.getItem(userSpecificKeys.username);
      
      const currentBalance = balanceManager.getCurrentBalance();
      const highestBalance = balanceManager.getHighestBalance();
      
      const effectiveLocalBalance = Math.max(currentBalance, highestBalance);
      
      if (cachedName) {
        window.dispatchEvent(new CustomEvent('user:refreshing', {
          detail: { 
            username: cachedName,
            subscription: cachedSubscription,
            balance: effectiveLocalBalance,
            userId
          }
        }));
      }
      
      const { data, error } = await supabase
        .from('user_balances')
        .select('subscription, balance')
        .eq('id', userId)
        .single();
        
      if (error || !data) {
        console.error("Failed to fetch user data:", error);
        setIsRefreshing(false);
        return false;
      }
      
      localStorage.setItem(userSpecificKeys.subscription, data.subscription);
      
      if (data.balance !== undefined && !isNaN(data.balance)) {
        const sources = [
          data.balance,
          effectiveLocalBalance,
          parseFloat(localStorage.getItem(`currentBalance_${userId}`) || '0'),
          parseFloat(localStorage.getItem(userSpecificKeys.balance) || '0'),
          parseFloat(localStorage.getItem(`lastUpdatedBalance_${userId}`) || '0'),
          parseFloat(sessionStorage.getItem(`currentBalance_${userId}`) || '0')
        ];
        
        const maxBalance = Math.max(...sources.filter(val => !isNaN(val) && val > 0));
        
        if (maxBalance > 0) {
          if (maxBalance > data.balance) {
            try {
              await supabase
                .from('user_balances')
                .update({ balance: maxBalance })
                .eq('id', userId);
                
              console.log(`Updated database balance to match local: ${maxBalance}€`);
            } catch (err) {
              console.error("Error updating database balance:", err);
            }
          }
          
          localStorage.setItem(`currentBalance_${userId}`, maxBalance.toString());
          localStorage.setItem(userSpecificKeys.balance, maxBalance.toString());
          localStorage.setItem(`lastUpdatedBalance_${userId}`, maxBalance.toString());
          sessionStorage.setItem(`currentBalance_${userId}`, maxBalance.toString());
        }
      }
      
      window.dispatchEvent(new CustomEvent('user:refreshed', {
        detail: { 
          subscription: data.subscription,
          balance: balanceManager.getCurrentBalance(),
          userId
        }
      }));
      
      setIsRefreshing(false);
      return true;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      setIsRefreshing(false);
      return false;
    }
  }, [isRefreshing]);

  return { refreshUserData, isRefreshing };
};

export default useUserDataRefresh;
