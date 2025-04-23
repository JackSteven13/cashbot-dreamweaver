
import { LocationData } from '../data/locationData';
import { adValueCategories } from '../data/adConstants';

export const calculateRevenueForLocation = (
  location: LocationData,
  ads: number
): number => {
  let totalRevenue = 0;
  const adTypes = Object.entries(location.adTypes);
  
  // Facteur d'augmentation global pour rendre les revenus BEAUCOUP plus élevés
  // et parfaitement synchronisés avec le nombre d'annonces
  const revenueBoostedFactor = 3.5; // Augmenté de 2.5 à 3.5 pour une meilleure corrélation
  
  // Garantir qu'un nombre minimum d'annonces génère des revenus
  const effectiveAdCount = Math.max(1, ads);
  
  for (let i = 0; i < effectiveAdCount; i++) {
    // Determine ad category based on location distribution
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
    
    // Calculate value based on ad type
    const category = adValueCategories[adType as keyof typeof adValueCategories];
    
    // Augmenter significativement les valeurs min et max pour chaque catégorie
    // pour assurer une parfaite synchronisation entre ads et revenus
    const boostedMin = category.min * revenueBoostedFactor;
    const boostedMax = category.max * revenueBoostedFactor;
    
    // Assurer une variance significative mais au moins la valeur minimale
    const adValue = boostedMin + Math.random() * (boostedMax - boostedMin);
    
    totalRevenue += adValue;
  }
  
  return totalRevenue;
};
