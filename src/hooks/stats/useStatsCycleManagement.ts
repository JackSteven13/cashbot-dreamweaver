
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
      // Réinitialisation avec des valeurs de départ substantielles (10-15% des objectifs)
      const initialAdsCount = Math.floor(dailyAdsTarget * (0.10 + Math.random() * 0.05));
      const initialRevenueCount = Math.floor(dailyRevenueTarget * (0.10 + Math.random() * 0.05));
      
      setAdsCount(initialAdsCount);
      setRevenueCount(initialRevenueCount);
      setDisplayedAdsCount(initialAdsCount);
      setDisplayedRevenueCount(initialRevenueCount);
      
      // Schedule next reset
      scheduleCycleUpdate();
    }, timeUntilMidnight);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount, dailyAdsTarget, dailyRevenueTarget]);

  // Utiliser un temps d'attente minimum entre les mises à jour pour éviter les fluctuations
  let lastUpdateTimestamp = 0;
  const minimumUpdateInterval = 8000; // 8 secondes minimum entre les incrémentations
  
  const incrementCountersRandomly = useCallback(() => {
    // Vérifier le temps écoulé depuis la dernière mise à jour
    const now = Date.now();
    if (now - lastUpdateTimestamp < minimumUpdateInterval) {
      return; // Ne pas mettre à jour si l'intervalle minimum n'est pas écoulé
    }
    lastUpdateTimestamp = now;
    
    // Distribution réaliste des annonces entre les pays
    setAdsCount(prevAdsCount => {
      // Ne pas dépasser l'objectif quotidien
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      
      // Calcul du taux d'incrémentation en fonction de l'heure
      const currentHour = new Date().getHours();
      let hourlyRate = 0.008; // Taux de base (0.8%)
      
      // Appliquer des variations selon l'heure de la journée
      if (currentHour >= 8 && currentHour <= 11) {
        // Matin: progression rapide
        hourlyRate = 0.012;
      } else if (currentHour >= 12 && currentHour <= 14) {
        // Midi: progression normale
        hourlyRate = 0.01;
      } else if (currentHour >= 15 && currentHour <= 19) {
        // Après-midi: progression rapide
        hourlyRate = 0.011;
      } else if (currentHour >= 20 && currentHour <= 23) {
        // Soir: progression normale
        hourlyRate = 0.009;
      } else {
        // Nuit: progression plus lente
        hourlyRate = 0.006;
      }
      
      // Objectif restant
      const remainingTarget = dailyAdsTarget - prevAdsCount;
      
      // Calcul du nombre d'annonces à traiter pour cet intervalle
      const baseAdsIncrement = Math.floor(remainingTarget * hourlyRate);
      
      // Variation aléatoire plus faible (±10% au lieu de ±20%)
      const variationFactor = 0.9 + (Math.random() * 0.2);
      const totalAdsIncrement = Math.floor(baseAdsIncrement * variationFactor);
      
      // Répartition entre les pays
      let adsByCountry = [];
      let totalAdsByCountry = 0;
      
      // Pour chaque pays, calculer sa contribution
      activeLocations.forEach(location => {
        // Proportion des annonces allouées à ce pays
        const countryShare = location.weight / totalWeight;
        
        // Base initiale pour ce pays
        const countryAdBase = Math.floor(totalAdsIncrement * countryShare);
        
        // Variation spécifique au pays (±5% au lieu de ±10%)
        const countryVariation = 0.95 + (Math.random() * 0.1);
        
        // Nombre d'annonces traitées par ce pays
        const countryAds = Math.floor(countryAdBase * countryVariation * location.efficiency);
        
        adsByCountry.push({
          country: location.country,
          ads: countryAds
        });
        
        totalAdsByCountry += countryAds;
      });
      
      // Calculer le nouvel état du compteur
      const newAdsCount = Math.min(prevAdsCount + totalAdsByCountry, dailyAdsTarget);
      
      // Mise à jour simultanée des revenus
      setRevenueCount(prevRevenueCount => {
        // Ne pas dépasser l'objectif quotidien
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        
        let totalRevenue = 0;
        
        // Calculer les revenus basés sur les annonces traitées par pays
        adsByCountry.forEach(({ ads }) => {
          for (let i = 0; i < ads; i++) {
            // Déterminer la catégorie de l'annonce
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
            
            totalRevenue += adValue;
          }
        });
        
        // Ajustement pour correspondre au ratio global attendu
        const expectedRatio = dailyRevenueTarget / dailyAdsTarget;
        const currentRatio = totalRevenue / totalAdsByCountry;
        const adjustmentFactor = expectedRatio / currentRatio;
        
        // Appliquer un ajustement aléatoire plus restreint (±3% au lieu de ±5%)
        const finalRevenue = totalRevenue * adjustmentFactor * (0.97 + Math.random() * 0.06);
        
        // Calculer le nouveau total avec un plafond pour éviter les sauts
        const maxAllowedIncrease = Math.min(
          finalRevenue, 
          prevRevenueCount * 0.015 // Limite à 1.5% d'augmentation par rapport à la valeur précédente
        );
        
        return Math.min(prevRevenueCount + maxAllowedIncrease, dailyRevenueTarget);
      });
      
      return newAdsCount;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
