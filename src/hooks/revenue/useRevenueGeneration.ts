
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';
import { checkAndUpdateDailyLimits } from './dailyLimits';
import { useBotStatus } from './useBotStatus';
import { calculateAutoSessionGain } from '@/utils/subscription';
import { triggerDashboardEvent } from '@/utils/animations/triggerDashboardEvent';
import { addTransaction, calculateTodaysGains } from '@/utils/user/transactionUtils';
import { respectsDailyLimit } from '@/utils/subscription/sessionManagement';
import { UserData } from '@/types/userData';

interface UseRevenueGenerationProps {
  userData: UserData | null;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
}

export const useRevenueGeneration = ({
  userData,
  updateBalance
}: UseRevenueGenerationProps) => {
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  const [lastGenerationTime, setLastGenerationTime] = useState(Date.now() - 60000);
  const [limitReached, setLimitReached] = useState(false);
  const [lastGainAmount, setLastGainAmount] = useState(0);
  const [consecutiveGenerationCount, setConsecutiveGenerationCount] = useState(0);
  const { isBotActive, setIsBotActive } = useBotStatus(limitReached);

  // Generate automatic revenue with strict limit checking
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData || limitReached || !isBotActive) {
      if (limitReached) {
        console.log("Skipping automatic revenue generation: daily limit reached");
      }
      return false;
    }

    const now = Date.now();
    const timeSinceLastGeneration = now - lastGenerationTime;

    if (!forceUpdate && timeSinceLastGeneration < 60000) {
      console.log("Generation too frequent, skipping...");
      return false;
    }

    const limits = await checkAndUpdateDailyLimits(
      userData,
      setDailyLimitProgress,
      setLimitReached,
      setIsBotActive
    );

    if (!limits) return false;

    setLastGenerationTime(now);

    try {
      const baseGain = calculateAutoSessionGain(
        userData.subscription,
        limits.dailyGains,
        userData.referrals?.length || 0
      );

      const { allowed, adjustedGain } = respectsDailyLimit(
        userData.subscription,
        limits.dailyGains,
        baseGain
      );

      if (!allowed) {
        setLimitReached(true);
        setIsBotActive(false);
        return false;
      }

      const finalGain = adjustedGain;
      const report = `Analyse automatique de contenu (jour ${Math.floor((Date.now() - new Date('2023-01-01').getTime()) / (1000 * 3600 * 24))})`;

      await updateBalance(finalGain, report, forceUpdate);
      
      // Trigger events and animations
      triggerDashboardEvent('analysis-complete', {
        gain: finalGain,
        noEffects: false,
        background: false,
        animate: true
      });

      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: finalGain,
          animate: true
        }
      }));

      setConsecutiveGenerationCount(prev => prev + 1);
      setLastGainAmount(finalGain);

      return true;
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      return false;
    }
  }, [userData, limitReached, isBotActive, lastGenerationTime, updateBalance]);

  return {
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached,
    generateAutomaticRevenue
  };
};
