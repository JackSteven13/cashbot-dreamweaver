
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
  
  // Simulation améliorée de multiples agents IA travaillant en parallèle
  const incrementCountersRandomly = useCallback(() => {
    // Calcul de l'incrément basé sur un nombre variable d'agents actifs
    const activeAgents = 7 + Math.floor(Math.random() * 5); // Entre 7 et 11 agents actifs
    
    // Chaque agent traite un nombre variable d'annonces
    setAdsCount(prevAdsCount => {
      // Ne pas dépasser la cible quotidienne
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      
      let totalAdsIncrement = 0;
      
      // Simuler chaque agent traitant des annonces
      for (let i = 0; i < activeAgents; i++) {
        // Durée variable des annonces (20-60 secondes)
        // Agents plus ou moins rapides
        const agentEfficiency = 0.7 + Math.random() * 0.6; // 70% à 130% d'efficacité
        const adsPerAgent = Math.floor((dailyAdsTarget * 0.0003) * agentEfficiency);
        totalAdsIncrement += adsPerAgent;
      }
      
      // Limite pour ne pas dépasser l'objectif
      const newAdsCount = Math.min(prevAdsCount + totalAdsIncrement, dailyAdsTarget);
      
      // Revenus variables générés par les annonces (entre 0.45€ et 3.30€ par annonce)
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        
        let totalRevenueIncrement = 0;
        
        for (let i = 0; i < totalAdsIncrement; i++) {
          // Simuler différentes valeurs d'annonces
          // La majorité sont de faible valeur, quelques-unes de haute valeur
          let adValue;
          const adTypeRandom = Math.random();
          
          if (adTypeRandom > 0.97) {
            // Annonces premium (3%)
            adValue = 2.20 + Math.random() * 1.10; // 2.20€ - 3.30€
          } else if (adTypeRandom > 0.85) {
            // Annonces moyennes-hautes (12%)
            adValue = 1.10 + Math.random() * 1.10; // 1.10€ - 2.20€
          } else if (adTypeRandom > 0.60) {
            // Annonces moyennes (25%)
            adValue = 0.70 + Math.random() * 0.40; // 0.70€ - 1.10€
          } else {
            // Annonces standards (60%)
            adValue = 0.45 + Math.random() * 0.25; // 0.45€ - 0.70€
          }
          
          totalRevenueIncrement += adValue;
        }
        
        // Ajuster le montant total des revenus pour qu'il soit cohérent avec la cible journalière
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
