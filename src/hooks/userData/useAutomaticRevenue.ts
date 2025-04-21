
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { addTransaction, calculateTodaysGains } from '@/utils/user/transactionUtils';
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
    
    // Check if limit is reached
    const isLimitReached = dailyGains >= limit * 0.99; // 99% of limit
    setLimitReached(isLimitReached);
    
    // If percentage reaches 99%, automatically deactivate bot
    if (isLimitReached && isBotActive) {
      setIsBotActive(false);
      console.log("Bot automatically deactivated: daily limit reached");
    }
  }, [userData, isBotActive, isNewUser]);
  
  // Listen for external events that modify bot state
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        console.log(`Bot status update in useAutomaticRevenue: ${isActive ? 'active' : 'inactive'}`);
        setIsBotActive(isActive);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, []);
  
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
      
      // Check if limit is reached (with 1% margin)
      if (todaysGains >= dailyLimit * 0.99) {
        console.log(`Daily limit reached: ${todaysGains}€/${dailyLimit}€`);
        setLimitReached(true);
        setIsBotActive(false);
        return false;
      }
      
      // Generate a random gain (smaller for automatic sessions)
      const minGain = 0.01;
      const maxGain = effectiveSub === 'freemium' ? 0.03 : 0.08;
      const potentialGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
      
      // Check and adjust gain to strictly respect daily limit
      const { allowed, adjustedGain } = respectsDailyLimit(
        effectiveSub,
        todaysGains,
        potentialGain
      );
      
      // If gain is blocked, stop the bot
      if (!allowed) {
        setLimitReached(true);
        setIsBotActive(false);
        return false;
      }
      
      // Use adjusted gain (which may be equal to potential gain if within limits)
      const finalGain = adjustedGain;
      
      // Create report for transaction
      const dayCount = Math.floor((Date.now() - new Date('2023-01-01').getTime()) / (1000 * 3600 * 24));
      const report = `Analyse automatique de contenu (jour ${dayCount})`;
      
      // Safe access to userData.profile?.id with fallback
      const userId = userData.profile?.id || userData.id;
      if (!userId) {
        console.error("Cannot record transaction: missing user ID");
        return false;
      }
      
      // Record transaction in database
      const transactionAdded = await addTransaction(userId, finalGain, report);
      
      if (!transactionAdded) {
        console.error("Failed to record transaction");
        return false;
      }
      
      // Update balance with generated gain
      await updateBalance(finalGain, report, forceUpdate);
      
      // Update balance manager
      balanceManager.updateBalance(finalGain);
      
      console.log(`Automatic revenue generated: ${finalGain}€`);
      
      // Trigger balance update animation
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { amount: finalGain, animate: true } 
      }));
      
      return true;
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      return false;
    }
  }, [userData, isNewUser, isBotActive, limitReached, updateBalance]);
  
  return {
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached,
    generateAutomaticRevenue
  };
};

export default useAutomaticRevenue;
