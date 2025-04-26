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
  
  useEffect(() => {
    if (!userData || isNewUser) {
      setDailyLimitProgress(0);
      return;
    }
    
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    const dailyGains = balanceManager.getDailyGains();
    
    const percentage = Math.min(100, (dailyGains / limit) * 100);
    setDailyLimitProgress(percentage);
    
    const isLimitReached = dailyGains >= limit * 0.9;
    setLimitReached(isLimitReached);
    
    if (isLimitReached && isBotActive) {
      setIsBotActive(false);
      console.log("Bot automatically deactivated: daily limit reached");
      
      localStorage.setItem('botActive', 'false');
    }
  }, [userData, isBotActive, isNewUser]);
  
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        if (isActive && limitReached) {
          console.log("Bot cannot be activated: limit already reached");
          return;
        }
        
        console.log(`Bot status update in useAutomaticRevenue: ${isActive ? 'active' : 'inactive'}`);
        setIsBotActive(isActive);
        
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
  
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData || isNewUser || !isBotActive || limitReached) {
      return false;
    }
    
    try {
      let todaysGains = balanceManager.getDailyGains();
      
      if (!forceUpdate) {
        const userId = userData.profile?.id || userData.id;
        if (!userId) {
          console.error("Cannot generate revenue: missing user ID");
          return false;
        }
        
        const actualGains = await calculateTodaysGains(userId);
        
        if (actualGains > todaysGains) {
          console.log(`Updating daily gains: ${todaysGains}€ -> ${actualGains}€ (based on DB transactions)`);
          todaysGains = actualGains;
          balanceManager.setDailyGains(actualGains);
        }
      }
      
      const effectiveSub = getEffectiveSubscription(userData.subscription);
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      if (todaysGains >= dailyLimit * 0.9) {
        console.log(`Daily limit almost reached: ${todaysGains}€/${dailyLimit}€`);
        setLimitReached(true);
        setIsBotActive(false);
        localStorage.setItem('botActive', 'false');
        return false;
      }
      
      const minGain = 0.001;
      const maxGain = effectiveSub === 'freemium' ? 0.01 : 0.03;
      const potentialGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(3));
      
      const remainingLimit = (dailyLimit * 0.9) - todaysGains;
      const safeGain = Math.min(potentialGain, remainingLimit * 0.7);
      
      const finalGain = parseFloat(safeGain.toFixed(3));
      
      if (finalGain <= 0.001) {
        console.log("Gain too small, generation aborted");
        return false;
      }
      
      const { allowed, adjustedGain } = respectsDailyLimit(
        effectiveSub,
        todaysGains,
        finalGain
      );
      
      if (!allowed) {
        setLimitReached(true);
        setIsBotActive(false);
        localStorage.setItem('botActive', 'false');
        return false;
      }
      
      const dayCount = Math.floor((Date.now() - new Date('2023-01-01').getTime()) / (1000 * 3600 * 24));
      const report = `Analyse automatique de contenu (jour ${dayCount})`;
      
      const userId = userData.profile?.id || userData.id;
      if (!userId) {
        console.error("Cannot record transaction: missing user ID");
        return false;
      }
      
      const now = Date.now();
      const shouldUpdateDb = forceUpdate || (now - lastDbUpdateTime > 10000);
      
      if (shouldUpdateDb) {
        const transaction = await addTransaction(userId, finalGain, report);
        
        if (!transaction) {
          console.error("Failed to record transaction");
        } else {
          console.log("Automatic transaction recorded successfully:", transaction);
        }
        
        setLastDbUpdateTime(now);
        
        await updateBalance(finalGain, report, true);
      }
      
      balanceManager.updateBalance(finalGain);
      balanceManager.addDailyGain(finalGain);
      
      const currentBalance = balanceManager.getCurrentBalance();
      
      console.log(`Automatic revenue generated: ${finalGain}€, current balance: ${currentBalance}€`);
      
      window.dispatchEvent(new CustomEvent('automatic:revenue', { 
        detail: { 
          amount: finalGain,
          timestamp: now,
          userId: userId,
          currentBalance: currentBalance
        } 
      }));
      
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { 
          amount: finalGain, 
          currentBalance: currentBalance,
          animate: true,
          timestamp: now,
          userId: userId
        } 
      }));
      
      window.dispatchEvent(new CustomEvent('balance:force-update', { 
        detail: { 
          newBalance: currentBalance,
          gain: finalGain,
          animate: true,
          timestamp: now,
          userId: userId,
          forceRefresh: true
        } 
      }));
      
      if (Math.random() > 0.7) {
        toast({
          title: `Gain automatique: +${finalGain.toFixed(2)}€`,
          description: `L'analyse automatique a généré ${finalGain.toFixed(2)}€`,
          duration: 3000,
        });
      }
      
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
