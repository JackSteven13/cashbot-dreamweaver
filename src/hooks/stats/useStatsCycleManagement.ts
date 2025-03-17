
import { useCallback } from 'react';
import { calculateTimeUntilNextReset } from '@/utils/timeUtils';

interface UseStatsCycleManagementParams {
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  // Schedule next cycle update
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilNextReset = calculateTimeUntilNextReset();
    
    // Convertir en jours pour l'affichage dans les logs
    const daysUntilReset = Math.floor(timeUntilNextReset / 1000 / 60 / 60 / 24);
    const hoursUntilReset = Math.floor((timeUntilNextReset / 1000 / 60 / 60) % 24);
    
    console.log(`Next counter reset scheduled in ${daysUntilReset} days and ${hoursUntilReset} hours`);
    
    const resetTimeout = setTimeout(() => {
      // Reset counters
      setAdsCount(0);
      setRevenueCount(0);
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Schedule the next reset
      scheduleCycleUpdate();
    }, timeUntilNextReset);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Incrémenter les compteurs de manière plus régulière et moins agitée
  const incrementCountersRandomly = useCallback(() => {
    // Calculer des incréments plus stables pour une progression plus régulière
    const dailyAdsIncrement = dailyAdsTarget / (24 * 60 * 20); // Incrément par 3 secondes
    const dailyRevenueIncrement = dailyRevenueTarget / (24 * 60 * 20); // Incrément par 3 secondes
    
    setAdsCount(prev => {
      // Petite variation aléatoire autour de l'incrément moyen (±10%)
      const randomFactor = 0.9 + (Math.random() * 0.2);
      const increment = Math.ceil(dailyAdsIncrement * randomFactor);
      return Math.min(prev + increment, dailyAdsTarget);
    });
    
    setRevenueCount(prev => {
      // Petite variation aléatoire autour de l'incrément moyen (±10%)
      const randomFactor = 0.9 + (Math.random() * 0.2);
      const increment = Math.ceil(dailyRevenueIncrement * randomFactor);
      return Math.min(prev + increment, dailyRevenueTarget);
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
