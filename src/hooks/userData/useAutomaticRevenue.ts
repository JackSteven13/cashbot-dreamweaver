
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { addTransaction, calculateTodaysGains } from '@/utils/userData/transactionUtils';
import { respectsDailyLimit } from '@/utils/subscription/sessionManagement';
import { toast } from '@/components/ui/use-toast';

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
  const [processingUpdate, setProcessingUpdate] = useState(false);
  const userId = userData?.id || userData?.profile?.id || null;
  
  // Calculate daily limit progress percentage with improved verification
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
    
    // If limit is now reached but wasn't before, show a toast notification
    if (isLimitReached && !limitReached) {
      toast({
        title: "Limite quotidienne atteinte",
        description: `Vous avez atteint votre limite quotidienne de ${limit.toFixed(2)}€.`,
        variant: "destructive",
        duration: 5000
      });
      
      // Broadcast event to update UI components
      window.dispatchEvent(new CustomEvent('daily-limit:reached', {
        detail: { 
          subscription: effectiveSub,
          limit: limit,
          currentGains: dailyGains
        }
      }));
    }
    
    setLimitReached(isLimitReached);
    
    // Automatically deactivate bot when limit is reached
    if (isLimitReached && isBotActive) {
      setIsBotActive(false);
      console.log("Bot automatically deactivated: daily limit reached");
      
      // Save state in localStorage
      localStorage.setItem('botActive', 'false');
    }
  }, [userData, isBotActive, isNewUser, limitReached]);
  
  // Listen for external events that modify bot state
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        // Enforce stricter limit checking before activating bot
        if (isActive && limitReached) {
          console.log("Bot cannot be activated: limit already reached");
          
          // Notify user that bot can't be activated due to limit
          toast({
            title: "Bot inactif",
            description: "Le robot ne peut pas être activé: limite quotidienne atteinte.",
            variant: "destructive"
          });
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
  
  // Improved automatic revenue generation with stricter limit checking
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData || isNewUser || !isBotActive || limitReached || processingUpdate) {
      if (limitReached) {
        console.log("Skipping automatic revenue generation: daily limit reached");
      }
      return false;
    }
    
    // Activate processing lock to prevent concurrent updates
    setProcessingUpdate(true);
    
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
          balanceManager.syncDailyGainsFromTransactions(actualGains);
        }
      }
      
      // Determine daily limit based on subscription
      const effectiveSub = getEffectiveSubscription(userData.subscription);
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // STRICTER CHECK: Compare with 85% of the limit to stop earlier
      if (todaysGains >= dailyLimit * 0.85) {
        console.log(`Daily limit almost reached: ${todaysGains.toFixed(2)}€/${dailyLimit}€`);
        setLimitReached(true);
        setIsBotActive(false);
        localStorage.setItem('botActive', 'false');
        
        // Notify all components about limit being reached
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: {
            subscription: effectiveSub,
            limit: dailyLimit,
            currentGains: todaysGains
          }
        }));
        
        return false;
      }
      
      // Generate smaller, more consistent gains
      const minGain = 0.001;
      const maxGain = effectiveSub === 'freemium' ? 0.003 : 0.005; // Reduced max gain
      const potentialGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(3));
      
      // EVEN MORE CAUTIOUS: Ensure gain won't exceed daily limit with larger margin
      const remainingLimit = (dailyLimit * 0.85) - todaysGains;
      const safeGain = Math.min(potentialGain, remainingLimit * 0.15); // Even more conservative
      
      // Use the smallest gain possible to avoid limit issues
      const finalGain = parseFloat(safeGain.toFixed(3));
      
      if (finalGain <= 0.001) {
        console.log("Gain too small, generation aborted");
        return false;
      }
      
      // Additional strict check using the respectsDailyLimit utility
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
        
        // Notify all components
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: {
            subscription: effectiveSub,
            limit: dailyLimit,
            currentGains: todaysGains
          }
        }));
        
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
      // Limit database updates to prevent spam
      const shouldUpdateDb = forceUpdate || (now - lastDbUpdateTime > 30000);
      
      if (shouldUpdateDb) {
        // Capture balance before update for comparison
        const balanceBefore = balanceManager.getCurrentBalance();
        
        // CRITICAL CHANGE: First verify if adding this gain would exceed daily limit
        const newDailyGainsTotal = todaysGains + finalGain;
        if (newDailyGainsTotal > dailyLimit) {
          console.log(`Prevented exceeding daily limit: ${todaysGains.toFixed(2)}€ + ${finalGain.toFixed(3)}€ > ${dailyLimit}€`);
          setLimitReached(true);
          return false;
        }
        
        // Record transaction in database FIRST
        const transaction = await addTransaction(userId, finalGain, report);
        
        if (!transaction.success) {
          console.error("Failed to record transaction");
          return false;
        } else {
          console.log("Automatic transaction recorded successfully");
        }
        
        // Update database timestamp
        setLastDbUpdateTime(now);
        
        // Update balance with generated gain
        await updateBalance(finalGain, report, forceUpdate);
        
        // Verify that balance increased correctly
        const balanceAfter = balanceManager.getCurrentBalance();
        if (balanceAfter < balanceBefore) {
          console.error(`Anomaly detected: Balance decreased from ${balanceBefore}€ to ${balanceAfter}€ after gain`);
          
          // Restore previous balance in centralized manager
          balanceManager.forceBalanceSync(balanceBefore + finalGain);
        }
      } else {
        // If not updating the database, at least update local manager
        balanceManager.updateBalance(finalGain);
        balanceManager.addDailyGain(finalGain);
      }
      
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
      
      // Update daily limit progress 
      const newDailyGains = todaysGains + finalGain;
      const newPercentage = Math.min(100, (newDailyGains / dailyLimit) * 100);
      setDailyLimitProgress(newPercentage);
      
      // Trigger balance update animation
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { 
          amount: finalGain, 
          currentBalance: currentBalance,
          animate: true,
          timestamp: now,
          dailyGains: newDailyGains,
          dailyLimit: dailyLimit,
          percentage: newPercentage
        } 
      }));
      
      // Force UI update to ensure balance is displayed correctly
      window.dispatchEvent(new CustomEvent('balance:force-update', { 
        detail: { 
          newBalance: currentBalance,
          gain: finalGain,
          animate: true,
          timestamp: now,
          dailyGains: newDailyGains
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
    } finally {
      // Disable processing lock once completed
      setProcessingUpdate(false);
    }
  }, [userData, isNewUser, isBotActive, limitReached, updateBalance, lastDbUpdateTime, processingUpdate]);
  
  return {
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached,
    lastGainAmount,
    setLastGainAmount,
    consecutiveGenerationCount,
    setConsecutiveGenerationCount,
    generateAutomaticRevenue
  };
};

export default useAutomaticRevenue;
