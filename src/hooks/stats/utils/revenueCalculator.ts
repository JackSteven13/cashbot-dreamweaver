
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

/**
 * Synchronise les revenus avec les publicités en utilisant un ratio constant
 * pour garantir que toute augmentation de publicités se traduit par une augmentation de revenus
 */
export const synchronizeRevenueWithAds = (adsCount: number): number => {
  // Utiliser exactement le même ratio pour maintenir une cohérence parfaite
  const PERFECT_CORRELATION_RATIO = 0.76203;
  
  // Appliquer le ratio et retourner le montant de revenus synchronisé
  return adsCount * PERFECT_CORRELATION_RATIO;
};

/**
 * Génère un petit incrément aléatoire pour les revenus basé sur l'incrément de pubs
 * mais en gardant le ratio global relativement constant
 */
export const generateRevenueIncrement = (adsIncrement: number): number => {
  const CORRELATION_RATIO = 0.76203;
  
  // Ajouter une très légère variation aléatoire autour du ratio parfait
  const jitterFactor = 1 + (Math.random() - 0.5) * 0.02; // ±1% variation
  
  // Calculer l'incrément de revenu correspondant
  return adsIncrement * CORRELATION_RATIO * jitterFactor;
};
