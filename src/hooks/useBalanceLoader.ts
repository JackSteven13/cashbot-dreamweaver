
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceLoader = (setIsNewUser: (isNew: boolean) => void) => {
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const loadUserBalance = useCallback(async (userId: string) => {
    if (isBalanceLoading) return null;
    
    try {
      setIsBalanceLoading(true);
      console.log("Loading balance for user:", userId);
      
      // Fetch balance from database
      const { data: balanceData, error: balanceError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (balanceError) {
        console.error("Error loading balance:", balanceError);
        return null;
      }
      
      // If balance exists, use it
      if (balanceData && typeof balanceData.balance === 'number') {
        const balance = parseFloat(balanceData.balance.toFixed(2));
        
        // If balance is zero or very low, might be a new user
        if (balance <= 0.1) {
          console.log("User appears to be new (zero or very low balance)");
          setIsNewUser(true);
        } else {
          setIsNewUser(false);
        }
        
        // Synchronize with balance manager
        balanceManager.forceBalanceSync(balance);
        
        console.log(`Loaded balance: ${balance}€`);
        setIsBalanceLoaded(true);
        
        // Store highest balance seen
        const currentHighest = balanceManager.getHighestBalance();
        if (balance > currentHighest) {
          console.log(`New highest balance: ${balance}€ (previous: ${currentHighest}€)`);
        }
        
        return {
          balance,
          loaded: true
        };
      } else {
        console.log("No balance found, user might be new");
        setIsNewUser(true);
        return {
          balance: 0,
          loaded: false
        };
      }
    } catch (error) {
      console.error("Error in loadUserBalance:", error);
      return null;
    } finally {
      setIsBalanceLoading(false);
    }
  }, [isBalanceLoading, setIsNewUser]);

  return { loadUserBalance, isBalanceLoaded, isBalanceLoading };
};

export default useBalanceLoader;
