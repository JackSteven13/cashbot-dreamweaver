
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';
import { checkAndUpdateDailyLimits } from './dailyLimits';
import { useBotStatus } from './useBotStatus';
import { calculateAutoSessionGain } from '@/utils/subscription';
import { triggerDashboardEvent } from '@/utils/animations/triggerDashboardEvent';
import { addTransaction } from '@/utils/user/transactionUtils';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

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

  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData) {
      console.log("Skipping automatic revenue generation: no user data");
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastGeneration = now - lastGenerationTime;

    // Ralentir la génération automatique
    if (!forceUpdate && timeSinceLastGeneration < 30000) { // 30 secondes minimum
      console.log("Generation too frequent, skipping...");
      return false;
    }

    // Réactiver la vérification des limites
    const limits = await checkAndUpdateDailyLimits(
      userData,
      setDailyLimitProgress,
      setLimitReached,
      setIsBotActive
    );
    
    if (!limits) return false;
    
    // Si la limite est atteinte ou presque atteinte, bloquer la génération
    if (limitReached || limits.percentage >= 90) {
      console.log("Daily limit reached, skipping revenue generation");
      setIsBotActive(false);
      return false;
    }

    setLastGenerationTime(now);

    try {
      // Génération de gains automatiques avec valeur réduite
      const baseGain = 0.01 + Math.random() * 0.04; // Entre 0.01€ et 0.05€
      
      // Calculer le montant restant disponible pour aujourd'hui
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const remainingAllowance = dailyLimit - limits.dailyGains;
      
      // Ajuster le gain pour ne pas dépasser la limite
      const finalGain = Math.min(
        parseFloat(baseGain.toFixed(2)), 
        parseFloat(remainingAllowance.toFixed(2))
      );
      
      // Si le gain serait trop petit, sauter cette génération
      if (finalGain < 0.01) {
        console.log("Gain trop petit, génération ignorée");
        return false;
      }
      
      const report = `Analyse automatique de contenu (${new Date().toLocaleTimeString()})`;

      await updateBalance(finalGain, report, forceUpdate);
      
      triggerDashboardEvent('analysis-complete', {
        gain: finalGain,
        noEffects: false,
        background: false,
        animate: true
      });

      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: finalGain,
          animate: finalGain > 0.01
        }
      }));

      setConsecutiveGenerationCount(prev => prev + 1);
      setLastGainAmount(finalGain);
      
      // Vérifier à nouveau si la limite est atteinte après cette génération
      const updatedGains = limits.dailyGains + finalGain;
      if (updatedGains >= dailyLimit * 0.95) {
        setLimitReached(true);
        setIsBotActive(false);
        
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: {
            subscription: subscription,
            limit: dailyLimit,
            currentGains: updatedGains,
            userId: userData.id
          }
        }));
      }

      return true;
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      return false;
    }
  }, [userData, lastGenerationTime, updateBalance, setIsBotActive, limitReached]);

  return {
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached,
    generateAutomaticRevenue
  };
};
