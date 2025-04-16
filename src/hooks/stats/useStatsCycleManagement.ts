
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

// Liste des pays actifs avec leurs bots
const activeLocations = [
  { country: "États-Unis", efficiency: 0.95 },
  { country: "Royaume-Uni", efficiency: 0.92 },
  { country: "France", efficiency: 0.94 },
  { country: "Allemagne", efficiency: 0.93 },
  { country: "Italie", efficiency: 0.91 },
  { country: "Espagne", efficiency: 0.90 },
  { country: "Suède", efficiency: 0.92 },
  { country: "Danemark", efficiency: 0.91 },
  { country: "Canada", efficiency: 0.93 },
  { country: "Australie", efficiency: 0.89 },
  { country: "Japon", efficiency: 0.94 },
  { country: "Pays-Bas", efficiency: 0.92 },
  { country: "Belgique", efficiency: 0.91 }
];

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  // Schedule cycle update at midnight, Paris time
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilMidnight = calculateTimeUntilMidnight();
    
    // Convert to hours for logs
    const hoursUntilMidnight = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesUntilMidnight = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    
    console.log(`Next counter reset in ${hoursUntilMidnight} hours and ${minutesUntilMidnight} minutes`);
    
    const resetTimeout = setTimeout(() => {
      // Reset counters at midnight, Paris time
      setAdsCount(0);
      setRevenueCount(0);
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Schedule next reset
      scheduleCycleUpdate();
    }, timeUntilMidnight);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  const incrementCountersRandomly = useCallback(() => {
    setAdsCount(prevAdsCount => {
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      
      let totalAdsIncrement = 0;
      
      // Chaque pays a un bot qui analyse les publicités
      activeLocations.forEach(location => {
        // Efficacité de base du bot selon le pays (90-95%)
        const baseEfficiency = location.efficiency;
        
        // Durée moyenne d'analyse d'une publicité (25-40 secondes)
        const adProcessingTime = 25 + Math.floor(Math.random() * 15);
        
        // Nombre de publicités traitées par ce bot
        const processedAds = Math.floor((60 / adProcessingTime) * baseEfficiency);
        totalAdsIncrement += processedAds;
      });

      // Réduire le total pour avoir une progression plus lente et réaliste
      totalAdsIncrement = Math.floor(totalAdsIncrement * 0.15);
      
      const newAdsCount = Math.min(prevAdsCount + totalAdsIncrement, dailyAdsTarget);
      
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        
        let totalRevenueIncrement = 0;
        
        // Calcul des revenus pour chaque publicité traitée
        for (let i = 0; i < totalAdsIncrement; i++) {
          const adTypeRandom = Math.random();
          
          let adValue;
          if (adTypeRandom > 0.97) {
            // Premium (3%) : 2.20€ - 3.30€
            adValue = 2.20 + (Math.random() * 1.10);
          } else if (adTypeRandom > 0.85) {
            // Medium-high (12%) : 1.10€ - 2.20€
            adValue = 1.10 + (Math.random() * 1.10);
          } else if (adTypeRandom > 0.60) {
            // Medium (25%) : 0.70€ - 1.10€
            adValue = 0.70 + (Math.random() * 0.40);
          } else {
            // Standard (60%) : 0.45€ - 0.70€
            adValue = 0.45 + (Math.random() * 0.25);
          }
          
          totalRevenueIncrement += adValue;
        }
        
        // Ajustement pour correspondre aux objectifs journaliers
        const adjustmentFactor = dailyRevenueTarget / dailyAdsTarget;
        totalRevenueIncrement = totalRevenueIncrement * adjustmentFactor * 0.8;
        
        return Math.min(prevRevenueCount + totalRevenueIncrement, dailyRevenueTarget);
      });
      
      return newAdsCount;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
