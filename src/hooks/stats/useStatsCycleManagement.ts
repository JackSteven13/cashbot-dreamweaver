
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
  { country: "États-Unis", efficiency: 0.95, weight: 1.8 },
  { country: "Royaume-Uni", efficiency: 0.92, weight: 1.2 },
  { country: "France", efficiency: 0.94, weight: 1.4 },
  { country: "Allemagne", efficiency: 0.93, weight: 1.3 },
  { country: "Italie", efficiency: 0.91, weight: 1.1 },
  { country: "Espagne", efficiency: 0.90, weight: 1.0 },
  { country: "Suède", efficiency: 0.92, weight: 0.9 },
  { country: "Danemark", efficiency: 0.91, weight: 0.8 },
  { country: "Canada", efficiency: 0.93, weight: 1.0 },
  { country: "Australie", efficiency: 0.89, weight: 0.7 },
  { country: "Japon", efficiency: 0.94, weight: 1.3 },
  { country: "Pays-Bas", efficiency: 0.92, weight: 0.8 },
  { country: "Belgique", efficiency: 0.91, weight: 0.7 }
];

// Calcul du poids total pour distribution proportionnelle
const totalWeight = activeLocations.reduce((sum, location) => sum + location.weight, 0);

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
      
      // Nombre total d'annonces à traiter pendant cet intervalle (basé sur une partie de la journée)
      // Taux extrêmement faible pour progression très lente
      const maxAdsPerInterval = Math.floor(dailyAdsTarget * 0.001); // 0.1% du total par intervalle
      
      // Distribution des annonces entre les pays selon leurs poids
      let totalAdsIncrement = 0;
      
      // Pour chaque pays, calculer le nombre d'annonces traitées
      activeLocations.forEach(location => {
        // Proportion des annonces allouées à ce pays basée sur son poids
        const countryShare = location.weight / totalWeight;
        const countryAdsBase = Math.floor(maxAdsPerInterval * countryShare);
        
        // Variation aléatoire légère (±10%)
        const variationFactor = 0.9 + Math.random() * 0.2;
        const countryAds = Math.floor(countryAdsBase * variationFactor * location.efficiency);
        
        // Durée de traitement d'une annonce (25-90 secondes) selon le pays
        // Ceci influence combien d'annonces peuvent être traitées
        const processingTime = 25 + Math.floor(Math.random() * 65);
        
        // Ajuster le nombre d'annonces traitées en fonction du temps de traitement
        const adjustedAds = Math.floor(countryAds * (60 / processingTime));
        
        totalAdsIncrement += adjustedAds;
      });
      
      // Ajouter une petite variation aléatoire au total (±5%)
      const finalVariation = 0.95 + Math.random() * 0.1;
      totalAdsIncrement = Math.floor(totalAdsIncrement * finalVariation);
      
      // Limiter l'incrément pour éviter des sauts trop grands
      const newAdsCount = Math.min(prevAdsCount + totalAdsIncrement, dailyAdsTarget);
      
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        
        let totalRevenueIncrement = 0;
        
        // Calcul des revenus pour chaque publicité traitée avec des prix réalistes
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
