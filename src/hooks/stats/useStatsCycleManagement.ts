
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

// Liste des pays actifs avec leurs bots, efficacité et pondération
const activeLocations = [
  { country: "États-Unis", efficiency: 0.95, weight: 1.8, botCount: 24, adTypes: { premium: 0.05, high: 0.15, medium: 0.30, standard: 0.50 } },
  { country: "Royaume-Uni", efficiency: 0.92, weight: 1.2, botCount: 16, adTypes: { premium: 0.03, high: 0.12, medium: 0.25, standard: 0.60 } },
  { country: "France", efficiency: 0.94, weight: 1.4, botCount: 18, adTypes: { premium: 0.04, high: 0.14, medium: 0.32, standard: 0.50 } },
  { country: "Allemagne", efficiency: 0.93, weight: 1.3, botCount: 17, adTypes: { premium: 0.04, high: 0.13, medium: 0.28, standard: 0.55 } },
  { country: "Italie", efficiency: 0.91, weight: 1.1, botCount: 14, adTypes: { premium: 0.03, high: 0.11, medium: 0.26, standard: 0.60 } },
  { country: "Espagne", efficiency: 0.90, weight: 1.0, botCount: 13, adTypes: { premium: 0.02, high: 0.10, medium: 0.28, standard: 0.60 } },
  { country: "Suède", efficiency: 0.92, weight: 0.9, botCount: 12, adTypes: { premium: 0.03, high: 0.12, medium: 0.30, standard: 0.55 } },
  { country: "Danemark", efficiency: 0.91, weight: 0.8, botCount: 10, adTypes: { premium: 0.03, high: 0.11, medium: 0.26, standard: 0.60 } },
  { country: "Canada", efficiency: 0.93, weight: 1.0, botCount: 13, adTypes: { premium: 0.04, high: 0.13, medium: 0.28, standard: 0.55 } },
  { country: "Australie", efficiency: 0.89, weight: 0.7, botCount: 9, adTypes: { premium: 0.02, high: 0.09, medium: 0.24, standard: 0.65 } },
  { country: "Japon", efficiency: 0.94, weight: 1.3, botCount: 17, adTypes: { premium: 0.05, high: 0.15, medium: 0.30, standard: 0.50 } },
  { country: "Pays-Bas", efficiency: 0.92, weight: 0.8, botCount: 10, adTypes: { premium: 0.03, high: 0.12, medium: 0.30, standard: 0.55 } },
  { country: "Belgique", efficiency: 0.91, weight: 0.7, botCount: 9, adTypes: { premium: 0.03, high: 0.11, medium: 0.28, standard: 0.58 } }
];

// Définition des catégories de prix pour les publicités (en EUR)
const adValueCategories = {
  premium: { min: 2.20, max: 3.60 },    // Publicités premium
  high: { min: 1.10, max: 2.20 },       // Publicités haute valeur
  medium: { min: 0.70, max: 1.10 },     // Publicités valeur moyenne
  standard: { min: 0.45, max: 0.70 }    // Publicités standard
};

// Simulation de durée de traitement des publicités (en ms)
const adProcessingTime = {
  premium: { min: 250, max: 400 },     // Plus long car analyse approfondie
  high: { min: 180, max: 280 },
  medium: { min: 120, max: 220 },
  standard: { min: 80, max: 150 }      // Plus rapide car moins complexe
};

// Calcul du poids total pour distribution proportionnelle
const totalWeight = activeLocations.reduce((sum, location) => sum + location.weight, 0);
// Calcul du nombre total de bots
const totalBotCount = activeLocations.reduce((sum, location) => sum + location.botCount, 0);

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

  // Variable pour suivre le dernier timestamp d'update
  let lastUpdateTimestamp = 0;
  // Utiliser un temps d'attente minimum entre les mises à jour
  const minimumUpdateInterval = 5000; // 5 secondes minimum entre les incrémentations
  
  const incrementCountersRandomly = useCallback(() => {
    // Vérifier le temps écoulé depuis la dernière mise à jour
    const now = Date.now();
    if (now - lastUpdateTimestamp < minimumUpdateInterval) {
      return; // Ne pas mettre à jour si l'intervalle minimum n'est pas écoulé
    }
    
    // Simuler des bursts d'activité aléatoires pour un comportement de bot plus réaliste
    const isBurstActivity = Math.random() > 0.85; // 15% de chance d'un burst d'activité
    // Ajuster le facteur d'activité en conséquence
    const activityFactor = isBurstActivity ? 2.5 : 1.0;
    
    lastUpdateTimestamp = now;
    
    // Distribution réaliste des annonces entre les pays
    setAdsCount(prevAdsCount => {
      // Ne pas dépasser l'objectif quotidien
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      
      // Calcul du taux d'incrémentation en fonction de l'heure du jour et de l'activité actuelle
      const currentHour = new Date().getHours();
      
      // Appliquer des variations selon l'heure de la journée
      let hourlyRateFactor;
      if (currentHour >= 8 && currentHour <= 11) {
        // Matin: progression rapide
        hourlyRateFactor = 1.3;
      } else if (currentHour >= 12 && currentHour <= 14) {
        // Midi: progression normale
        hourlyRateFactor = 1.1;
      } else if (currentHour >= 15 && currentHour <= 19) {
        // Après-midi: progression rapide
        hourlyRateFactor = 1.2;
      } else if (currentHour >= 20 && currentHour <= 23) {
        // Soir: progression normale
        hourlyRateFactor = 1.0;
      } else {
        // Nuit: progression plus lente
        hourlyRateFactor = 0.6;
      }
      
      // Taux de base ajusté selon l'heure et l'activité
      const baseHourlyRate = 0.006 * hourlyRateFactor * activityFactor;
      
      // Objectif restant
      const remainingTarget = dailyAdsTarget - prevAdsCount;
      
      // Calcul du nombre d'annonces à traiter pour cet intervalle
      const baseAdsIncrement = Math.floor(remainingTarget * baseHourlyRate);
      
      // Variation aléatoire plus réaliste (±15%)
      const variationFactor = 0.85 + (Math.random() * 0.3);
      const rawTotalAdsIncrement = Math.floor(baseAdsIncrement * variationFactor);
      
      // S'assurer que l'incrément est toujours positif et ne dépasse pas l'objectif
      const totalAdsIncrement = Math.min(
        Math.max(10, rawTotalAdsIncrement), // Au moins 10 annonces par mise à jour
        remainingTarget
      );
      
      // Répartition entre les pays
      let adsByCountry = [];
      let totalAdsByCountry = 0;
      
      // Pour chaque pays, calculer sa contribution
      activeLocations.forEach(location => {
        // Proportion des annonces allouées à ce pays
        const countryShare = location.weight / totalWeight;
        
        // Base initiale pour ce pays
        const countryAdBase = Math.floor(totalAdsIncrement * countryShare);
        
        // Ajustement basé sur l'efficacité et le nombre de bots du pays
        const botEfficiencyFactor = (location.efficiency * location.botCount / 10);
        
        // Variation spécifique au pays (±7%)
        const countryVariation = 0.93 + (Math.random() * 0.14);
        
        // Nombre d'annonces traitées par ce pays, ajusté par l'activité des bots
        const countryAds = Math.floor(countryAdBase * countryVariation * botEfficiencyFactor);
        
        adsByCountry.push({
          country: location.country,
          ads: countryAds,
          adTypeDistribution: location.adTypes
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
        
        // Calculer les revenus basés sur les annonces traitées par pays et par type d'annonce
        adsByCountry.forEach(({ ads, adTypeDistribution }) => {
          const adTypes = Object.entries(adTypeDistribution);
          
          for (let i = 0; i < ads; i++) {
            // Déterminer la catégorie de l'annonce selon la distribution du pays
            let adType = "standard";
            const randomValue = Math.random();
            let cumulativeProbability = 0;
            
            for (const [type, probability] of adTypes) {
              cumulativeProbability += probability as number;
              if (randomValue <= cumulativeProbability) {
                adType = type;
                break;
              }
            }
            
            // Déterminer la valeur selon le type d'annonce
            const category = adValueCategories[adType as keyof typeof adValueCategories];
            const adValue = category.min + Math.random() * (category.max - category.min);
            
            totalRevenue += adValue;
          }
        });
        
        // Ajustement pour correspondre au ratio global attendu avec une variation naturelle
        const expectedRatio = dailyRevenueTarget / dailyAdsTarget;
        const currentRatio = totalRevenue / totalAdsByCountry;
        const adjustmentFactor = expectedRatio / currentRatio;
        
        // Appliquer un ajustement aléatoire réaliste (±4%)
        const finalRevenue = totalRevenue * adjustmentFactor * (0.96 + Math.random() * 0.08);
        
        // Simuler des "bursts" occasionnels de publicités premium
        const premiumBurst = Math.random() > 0.93; // 7% de chance
        if (premiumBurst) {
          // Simuler un lot de publicités premium traitées ensemble
          const premiumBonus = Math.random() * 200 + 50; // 50-250€ supplémentaires
          totalRevenue += premiumBonus;
        }
        
        // Calculer le nouveau total avec une progression stable mais non-linéaire
        // Limiter l'augmentation pour éviter les sauts trop importants
        const maxAllowedIncrease = Math.min(
          finalRevenue, 
          isBurstActivity 
            ? prevRevenueCount * 0.025 // 2.5% pendant les bursts
            : prevRevenueCount * 0.012  // 1.2% en temps normal
        );
        
        // Calculer le nouveau total de revenus
        const newRevenueCount = Math.min(prevRevenueCount + maxAllowedIncrease, dailyRevenueTarget);
        
        return newRevenueCount;
      });
      
      return newAdsCount;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
