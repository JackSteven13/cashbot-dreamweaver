
import { useCallback } from 'react';
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

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
  // Schedule next cycle update at midnight Paris time
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilMidnight = calculateTimeUntilMidnight();
    
    // Convert to hours for the logs
    const hoursUntilMidnight = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesUntilMidnight = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    
    console.log(`Next counter reset scheduled in ${hoursUntilMidnight} hours and ${minutesUntilMidnight} minutes`);
    
    const resetTimeout = setTimeout(() => {
      // Reset counters at midnight Paris time
      setAdsCount(0);
      setRevenueCount(0);
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Schedule the next reset
      scheduleCycleUpdate();
    }, timeUntilMidnight);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Incréments ultra-rapides pour montrer une opération mondiale à très haut volume
  const incrementCountersRandomly = useCallback(() => {
    // Calculer le revenu moyen par publicité, avec une variance BEAUCOUP plus élevée
    const baseRevenuePerAd = dailyRevenueTarget / dailyAdsTarget;
    
    // Calculs mis à jour pour une opération à très haute fréquence
    const secondsInDay = 24 * 60 * 60;
    // Multiplicateur extrêmement élevé pour une progression impressionnante
    const cycleMultiplier = 120; 
    const adsIncrementPerSecond = (dailyAdsTarget * cycleMultiplier) / secondsInDay;
    
    // Forte randomisation pour un mouvement spectaculaire des compteurs
    const randomFactor = Math.random() * 8 + 2; // Aléatoire entre 2-10x
    
    // Incréments massifs par mise à jour pour les publicités
    const adsIncrement = Math.ceil(adsIncrementPerSecond * randomFactor);
    
    setAdsCount(prevAdsCount => {
      // Ne s'incrémente que si nous n'avons pas atteint la cible
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      const newAdsCount = Math.min(prevAdsCount + adsIncrement, dailyAdsTarget);
      
      // Mise à jour des revenus avec des increments EXTRÊMEMENT variables pour refléter des publicités à forte valeur
      const adsDifference = newAdsCount - prevAdsCount;
      
      // Parfois on obtient des publicités TRÈS rentables (jusqu'à 15€ par publicité)
      let revenueMultiplier;
      const valueRoll = Math.random();
      
      if (valueRoll > 0.96) {
        // Publicités EXCEPTIONNELLES (10-15€ par pub)
        revenueMultiplier = baseRevenuePerAd * (10 + Math.random() * 5);
        console.log("💎 JACKPOT: Publicité exceptionnelle détectée!");
      } else if (valueRoll > 0.90) {
        // Publicités premium (6-10€ par pub)
        revenueMultiplier = baseRevenuePerAd * (6 + Math.random() * 4);
        console.log("💰 Publicité premium détectée!");
      } else if (valueRoll > 0.75) {
        // Publicités très rentables (3-6€ par pub)
        revenueMultiplier = baseRevenuePerAd * (3 + Math.random() * 3);
      } else if (valueRoll > 0.5) {
        // Publicités rentables (2-3€ par pub)
        revenueMultiplier = baseRevenuePerAd * (2 + Math.random());
      } else {
        // Publicités standard avec légère variance
        revenueMultiplier = baseRevenuePerAd * (0.8 + Math.random() * 0.7);
      }
      
      const revenueIncrement = adsDifference * revenueMultiplier;
      
      // Mise à jour directe des revenus en fonction des nouvelles publicités
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        return Math.min(prevRevenueCount + revenueIncrement, dailyRevenueTarget);
      });
      
      return newAdsCount;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
