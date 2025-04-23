
import { LocationData } from '../data/locationData';
import { adValueCategories } from '../data/adConstants';

export const calculateRevenueForLocation = (
  location: LocationData,
  ads: number
): number => {
  let totalRevenue = 0;
  const adTypes = Object.entries(location.adTypes);
  
  // Facteur d'augmentation global pour rendre les revenus BEAUCOUP plus élevés
  // et synchronisés avec le nombre d'annonces
  const revenueBoostedFactor = 2.5; // Augmenté de 2.0 à 2.5
  
  for (let i = 0; i < ads; i++) {
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
    // pour assurer une synchronisation entre ads et revenus
    const boostedMin = category.min * revenueBoostedFactor;
    const boostedMax = category.max * revenueBoostedFactor;
    
    // Assurer une variance significative mais au moins la valeur minimale
    const adValue = boostedMin + Math.random() * (boostedMax - boostedMin);
    
    totalRevenue += adValue;
  }
  
  return totalRevenue;
};
