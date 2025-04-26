
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
  const [lastGainAmount, setLastGainAmount] = useState(0);
  const [consecutiveGenerationCount, setConsecutiveGenerationCount] = useState(0);
  
  // Calculate daily limit progress percentage
  useEffect(() => {
    if (!userData || isNewUser) {
      setDailyLimitProgress(0);
      return;
    }
    
    const updateLimitProgress = async () => {
      const effectiveSub = getEffectiveSubscription(userData.subscription);
      const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Get daily gains from database to ensure accuracy
      const userId = userData.profile?.id || userData.id;
      if (!userId) return;
      
      const actualGains = await calculateTodaysGains(userId);
      
      // Update local tracking to match database
      balanceManager.setDailyGains(actualGains);
      
      // Calculate percentage of daily limit
      const percentage = Math.min(100, (actualGains / limit) * 100);
      setDailyLimitProgress(percentage);
      
      // Check if limit is reached (90% of limit for early prevention)
      const isLimitReached = actualGains >= limit * 0.9;
      setLimitReached(isLimitReached);
      
      // If percentage reaches 90%, automatically deactivate bot
      if (isLimitReached && isBotActive) {
        setIsBotActive(false);
        console.log("Bot automatically deactivated: daily limit reached");
        
        // Save state in localStorage
        localStorage.setItem('botActive', 'false');
      }
    };
    
    updateLimitProgress();
    
    // Check limit progress periodically
    const checkInterval = setInterval(updateLimitProgress, 60000); // Every minute
    
    return () => clearInterval(checkInterval);
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
    
    // Check if bot was previously active
    const previouslyActive = localStorage.getItem('botActive') === 'true';
    if (previouslyActive && !limitReached) {
      setIsBotActive(true);
    }
    
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
      // Get total already earned today from database for accuracy
      const userId = userData.profile?.id || userData.id;
      if (!userId) {
        console.error("Cannot generate revenue: missing user ID");
        return false;
      }
      
      const todaysGains = await calculateTodaysGains(userId);
      
      // Update local tracking to match database
      balanceManager.setDailyGains(todaysGains);
      
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
        console.log("Gain trop faible, génération abandonnée");
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
      
      // Record transaction in database
      const transactionAdded = await addTransaction(userId, finalGain, report);
      
      if (!transactionAdded.success) {
        console.error("Failed to record transaction");
        return false;
      }
      
      console.log(`Automatic revenue generated: ${finalGain}€`);
      
      // Update balance with generated gain
      await updateBalance(finalGain, report, true);
      
      // Update balance manager
      balanceManager.updateBalance(finalGain);
      balanceManager.addDailyGain(finalGain);
      
      // Get the current balance after update
      const updatedBalance = balanceManager.getCurrentBalance();
      
      // Trigger balance update animation and UI refresh
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { 
          amount: finalGain, 
          animate: true, 
          userId, 
          timestamp: Date.now(),
          currentBalance: updatedBalance
        } 
      }));
      
      // Force a balance update to ensure UI is updated
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('balance:force-update', { 
          detail: { 
            newBalance: updatedBalance, 
            timestamp: Date.now(),
            userId,
            animate: true,
            gain: finalGain
          } 
        }));
      }, 300);
      
      // Monitor for errors - ensure proper update
      setTimeout(() => {
        const currentBalance = balanceManager.getCurrentBalance();
        const localStorageBalance = parseFloat(localStorage.getItem(`currentBalance_${userId}`) || '0');
        
        if (Math.abs(currentBalance - localStorageBalance) > 0.01) {
          console.log(`Balance inconsistency detected. Manager: ${currentBalance}, Storage: ${localStorageBalance}`);
          const maxBalance = Math.max(currentBalance, localStorageBalance);
          balanceManager.forceBalanceSync(maxBalance, userId);
          localStorage.setItem(`currentBalance_${userId}`, maxBalance.toFixed(2));
          
          // Forcer une mise à jour UI
          window.dispatchEvent(new CustomEvent('balance:force-update', { 
            detail: { 
              newBalance: maxBalance, 
              timestamp: Date.now(),
              userId,
              animate: false,
              forceRefresh: true
            } 
          }));
        }
      }, 2000);
      
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
