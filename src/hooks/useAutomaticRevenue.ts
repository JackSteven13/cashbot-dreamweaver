
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { triggerDashboardEvent } from '@/utils/animations/triggerDashboardEvent';
import { useRevenueGeneration } from './revenue/useRevenueGeneration';

interface AutomaticRevenueProps {
  userData: UserData | null;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
}

export const useAutomaticRevenue = ({
  userData,
  updateBalance
}: AutomaticRevenueProps) => {
  // Utiliser le hook refactorisé pour la génération de revenus
  const revenueGeneration = useRevenueGeneration({ userData, updateBalance });
  
  // Toujours actif par défaut
  const [isBotActive, setIsBotActive] = useState(true);
  
  // S'assurer que le bot est toujours actif
  useEffect(() => {
    if (!isBotActive) {
      console.log("Activation forcée du bot dans useAutomaticRevenue");
      setIsBotActive(true);
    }
  }, [isBotActive]);
  
  return {
    generateAutomaticRevenue: revenueGeneration.generateAutomaticRevenue,
    isBotActive: true, // Toujours actif
    dailyLimitProgress: revenueGeneration.dailyLimitProgress
  };
};

export default useAutomaticRevenue;
