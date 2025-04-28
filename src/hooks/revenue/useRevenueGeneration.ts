
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';
import { checkAndUpdateDailyLimits } from './dailyLimits';
import { useBotStatus } from './useBotStatus';
import { calculateAutoSessionGain } from '@/utils/subscription';
import { triggerDashboardEvent } from '@/utils/animations/triggerDashboardEvent';
import { addTransaction } from '@/utils/user/transactionUtils';
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

  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData) {
      console.log("Skipping automatic revenue generation: no user data");
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastGeneration = now - lastGenerationTime;

    // Raccourci pour les tests
    if (!forceUpdate && timeSinceLastGeneration < 15000) { // 15 secondes
      console.log("Generation too frequent, skipping...");
      return false;
    }

    // Désactiver temporairement la vérification de limite pour permettre aux gains de continuer
    // const limits = await checkAndUpdateDailyLimits(
    //   userData,
    //   setDailyLimitProgress,
    //   setLimitReached,
    //   setIsBotActive
    // );
    
    // if (!limits) return false;

    // Forcer l'exécution même si la limite est atteinte
    setLastGenerationTime(now);

    try {
      // Génération de gains automatiques avec valeur augmentée
      const baseGain = 0.05 + Math.random() * 0.15; // Entre 0.05 et 0.20€ par génération automatique

      // Pour garantir que le gain soit toujours appliqué
      const finalGain = parseFloat(baseGain.toFixed(2));
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
          animate: finalGain > 0.05
        }
      }));

      setConsecutiveGenerationCount(prev => prev + 1);
      setLastGainAmount(finalGain);

      return true;
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      return false;
    }
  }, [userData, lastGenerationTime, updateBalance, setIsBotActive]);

  return {
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached,
    generateAutomaticRevenue
  };
};
