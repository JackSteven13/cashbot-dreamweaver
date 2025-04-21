
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { addTransaction, calculateTodaysGains } from '@/utils/userData/transactionUtils';
import { respectsDailyLimit } from '@/utils/subscription/sessionManagement';

interface UseAutomaticRevenueProps {
  userData: UserData | null;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  isNewUser?: boolean;
}

export const useAutomaticRevenue = ({
  userData, 
  updateBalance,
  isNewUser = false
}: UseAutomaticRevenueProps) => {
  const [isBotActive, setIsBotActive] = useState(false);
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [lastGainAmount, setLastGainAmount] = useState(0);
  const [consecutiveGenerationCount, setConsecutiveGenerationCount] = useState(0);
  const [lastDbUpdateTime, setLastDbUpdateTime] = useState(0);
  
  // Calculate daily limit progress percentage
  useEffect(() => {
    if (!userData || isNewUser) {
      setDailyLimitProgress(0);
      return;
    }
    
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Get daily gains from centralized manager
    const dailyGains = balanceManager.getDailyGains();
    
    // Calculate percentage of daily limit
    const percentage = Math.min(100, (dailyGains / limit) * 100);
    setDailyLimitProgress(percentage);
    
    // Check if limit is reached (90% of limit for early prevention)
    const isLimitReached = dailyGains >= limit * 0.9;
    setLimitReached(isLimitReached);
    
    // If percentage reaches 90%, automatically deactivate bot
    if (isLimitReached && isBotActive) {
      setIsBotActive(false);
      console.log("Bot automatically deactivated: daily limit reached");
      
      // Save state in localStorage
      localStorage.setItem('botActive', 'false');
    }
  }, [userData, isBotActive, isNewUser]);
  
  // Listen for external events that modify bot state
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        // Check if limit is reached before activating bot
        if (isActive && limitReached) {
          console.log("Bot cannot be activated: limit already reached");
          return;
        }
        
        console.log(`Bot status update in useAutomaticRevenue: ${isActive ? 'active' : 'inactive'}`);
        setIsBotActive(isActive);
        
        // Save state in localStorage
        localStorage.setItem('botActive', isActive.toString());
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, [limitReached]);
  
  // Automatic revenue generation function with strict limit enforcement
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData || isNewUser || !isBotActive || limitReached) {
      return false;
    }
    
    try {
      // Get total already earned today from centralized manager
      let todaysGains = balanceManager.getDailyGains();
      
      // Additional verification with database transactions
      if (!forceUpdate) {
        // Safe access to userData.profile?.id with fallback
        const userId = userData.profile?.id || userData.id;
        if (!userId) {
          console.error("Cannot generate revenue: missing user ID");
          return false;
        }
        
        const actualGains = await calculateTodaysGains(userId);
        
        // If actual gains are higher than our local tracking, update our local tracking
        if (actualGains > todaysGains) {
          console.log(`Updating daily gains: ${todaysGains}€ -> ${actualGains}€ (based on DB transactions)`);
          todaysGains = actualGains;
          balanceManager.setDailyGains(actualGains);
        }
      }
      
      // Determine daily limit based on subscription
      const effectiveSub = getEffectiveSubscription(userData.subscription);
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Check if limit is reached (with 90% margin for prevention)
      if (todaysGains >= dailyLimit * 0.9) {
        console.log(`Daily limit almost reached: ${todaysGains}€/${dailyLimit}€`);
        setLimitReached(true);
        setIsBotActive(false);
        localStorage.setItem('botActive', 'false');
        return false;
      }
      
      // Generate a random gain (smaller for automatic sessions)
      const minGain = 0.001;
      const maxGain = effectiveSub === 'freemium' ? 0.01 : 0.03;
      const potentialGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(3));
      
      // Ensure the gain won't exceed the daily limit
      const remainingLimit = (dailyLimit * 0.9) - todaysGains;
      const safeGain = Math.min(potentialGain, remainingLimit * 0.7);
      
      // Use the smallest gain possible to avoid limit issues
      const finalGain = parseFloat(safeGain.toFixed(3));
      
      if (finalGain <= 0.001) {
        console.log("Gain too small, generation aborted");
        return false;
      }
      
      // Check and adjust gain to strictly respect daily limit
      const { allowed, adjustedGain } = respectsDailyLimit(
        effectiveSub,
        todaysGains,
        finalGain
      );
      
      // If gain is blocked, stop the bot
      if (!allowed) {
        setLimitReached(true);
        setIsBotActive(false);
        localStorage.setItem('botActive', 'false');
        return false;
      }
      
      // Create report for transaction
      const dayCount = Math.floor((Date.now() - new Date('2023-01-01').getTime()) / (1000 * 3600 * 24));
      const report = `Analyse automatique de contenu (jour ${dayCount})`;
      
      // Safe access to userData.profile?.id with fallback
      const userId = userData.profile?.id || userData.id;
      if (!userId) {
        console.error("Cannot record transaction: missing user ID");
        return false;
      }
      
      const now = Date.now();
      // Limit database updates to once every 10 seconds at most
      const shouldUpdateDb = forceUpdate || (now - lastDbUpdateTime > 10000);
      
      if (shouldUpdateDb) {
        // Record transaction in database
        const transaction = await addTransaction(userId, finalGain, report);
        
        if (!transaction) {
          console.error("Failed to record transaction");
        } else {
          console.log("Automatic transaction recorded successfully:", transaction);
        }
        
        // Update database timestamp
        setLastDbUpdateTime(now);
        
        // Update balance with generated gain
        await updateBalance(finalGain, report, forceUpdate);
      }
      
      // Update balance manager locally (always do this)
      balanceManager.updateBalance(finalGain);
      balanceManager.addDailyGain(finalGain);
      
      // Get current balance from manager
      const currentBalance = balanceManager.getCurrentBalance();
      
      console.log(`Automatic revenue generated: ${finalGain}€, current balance: ${currentBalance}€`);
      
      // Dispatch events to update UI
      
      // First, trigger automatic revenue event to create transaction record
      window.dispatchEvent(new CustomEvent('automatic:revenue', { 
        detail: { 
          amount: finalGain,
          timestamp: now
        } 
      }));
      
      // Trigger balance update animation
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { 
          amount: finalGain, 
          currentBalance: currentBalance,
          animate: true,
          timestamp: now
        } 
      }));
      
      // Force UI update to ensure balance is displayed correctly
      window.dispatchEvent(new CustomEvent('balance:force-update', { 
        detail: { 
          newBalance: currentBalance,
          gain: finalGain,
          animate: true,
          timestamp: now 
        } 
      }));
      
      // Also notify that there's a new transaction to display
      window.dispatchEvent(new CustomEvent('transactions:refresh', {
        detail: { timestamp: now }
      }));
      
      return true;
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      return false;
    }
  }, [userData, isNewUser, isBotActive, limitReached, updateBalance, lastDbUpdateTime]);
  
  return {
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached,
    generateAutomaticRevenue
  };
};

export default useAutomaticRevenue;
