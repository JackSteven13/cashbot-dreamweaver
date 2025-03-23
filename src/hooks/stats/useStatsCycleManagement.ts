
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
  // Planifier la mise à jour du cycle à minuit, heure de Paris
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilMidnight = calculateTimeUntilMidnight();
    
    // Convertir en heures pour les logs
    const hoursUntilMidnight = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesUntilMidnight = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    
    console.log(`Prochaine réinitialisation des compteurs dans ${hoursUntilMidnight} heures et ${minutesUntilMidnight} minutes`);
    
    const resetTimeout = setTimeout(() => {
      // Réinitialiser les compteurs à minuit, heure de Paris
      setAdsCount(0);
      setRevenueCount(0);
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Planifier la prochaine réinitialisation
      scheduleCycleUpdate();
    }, timeUntilMidnight);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Logique d'incrémentation repensée pour une progression plus réaliste
  const incrementCountersRandomly = useCallback(() => {
    // Incrémentations plus modestes et réalistes
    setAdsCount(prevAdsCount => {
      // Seulement incrémenter, jamais diminuer
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      
      // Calculer un pourcentage plus petit de la cible quotidienne à ajouter
      const increment = Math.floor(dailyAdsTarget * 0.0025); // 0.25% au lieu de 1%
      const newAdsCount = Math.min(prevAdsCount + increment, dailyAdsTarget);
      
      // Toujours mettre à jour les revenus en même temps que les annonces, avec un ratio fixe
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        
        // Utiliser un revenu fixe par annonce pour la stabilité
        const averageRevenuePerAd = dailyRevenueTarget / dailyAdsTarget;
        const revenueIncrement = Math.floor((newAdsCount - prevAdsCount) * averageRevenuePerAd);
        
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
