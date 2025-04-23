
import { LocationData } from '../data/locationData';
import { adValueCategories } from '../data/adConstants';

/**
 * Calcule les revenus pour une localisation donnée avec une parfaite
 * corrélation avec le nombre de publicités
 */
export const calculateRevenueForLocation = (
  location: LocationData,
  ads: number
): number => {
  // FORCER une parfaite corrélation entre les publicités et revenus
  // avec un facteur de conversion fixe
  const REVENUE_PER_AD = 0.76203;
  
  // Calculer directement le revenu basé sur le nombre de publicités
  // Cette garantit que le revenu évolue toujours quand les pubs évoluent
  return ads * REVENUE_PER_AD;
};
