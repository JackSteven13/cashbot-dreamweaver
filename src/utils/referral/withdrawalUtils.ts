/**
 * Utilitaires liés aux seuils de retrait selon le niveau d'abonnement
 */

// Seuils de retrait par type d'abonnement - ALIGNÉS AVEC LES CONSTANTES GLOBALES, et SUPERIEURS sur chaque offre
const WITHDRAWAL_THRESHOLDS = {
  freemium: 300,   // 300€
  starter: 600,    // 600€
  gold: 1200,      // 1200€
  elite: 2500,     // 2500€
  // Fallback
  default: 300     // 300€
};

/**
 * Obtient le seuil de retrait pour un type d'abonnement donné
 * @param subscription Type d'abonnement
 * @returns Montant minimum pour le retrait
 */
export const getWithdrawalThreshold = (subscription: string): number => {
  if (!subscription) return WITHDRAWAL_THRESHOLDS.default;
  
  const lowerSub = subscription.toLowerCase();
  return WITHDRAWAL_THRESHOLDS[lowerSub as keyof typeof WITHDRAWAL_THRESHOLDS] || WITHDRAWAL_THRESHOLDS.default;
};

/**
 * Vérifie si un utilisateur peut retirer ses gains
 * @param balance Solde actuel
 * @param subscription Type d'abonnement
 * @returns True si le retrait est possible
 */
export const canWithdraw = (balance: number, subscription: string): boolean => {
  const threshold = getWithdrawalThreshold(subscription);
  return balance >= threshold;
};

/**
 * Calcule le pourcentage d'avancement vers le seuil de retrait
 * @param balance Solde actuel
 * @param subscription Type d'abonnement
 * @returns Pourcentage d'avancement (0-100)
 */
export const getWithdrawalProgress = (balance: number, subscription: string): number => {
  const threshold = getWithdrawalThreshold(subscription);
  if (!threshold) return 0;
  
  const progress = (balance / threshold) * 100;
  return Math.min(100, Math.max(0, progress));
};

/**
 * Vérifie si le retrait est autorisé pour le type d'abonnement et le nombre de parrainages
 * @param subscription Type d'abonnement
 * @param referralCount Nombre de parrainages actifs
 * @returns True si le retrait est autorisé
 */
export const isWithdrawalAllowed = (subscription: string, referralCount: number): boolean => {
  // Les comptes freemium doivent avoir au moins un parrainage
  if (subscription?.toLowerCase() === 'freemium') {
    return referralCount >= 1;
  }
  
  // Les autres types d'abonnements peuvent toujours retirer
  return true;
};

/**
 * Calcule les frais de retrait en fonction de l'ancienneté et du type d'abonnement
 * @param registrationDate Date d'inscription
 * @param subscription Type d'abonnement
 * @returns Pourcentage des frais (0-1)
 */
export const calculateWithdrawalFee = (registrationDate: Date, subscription: string): number => {
  const today = new Date();
  const accountAgeInDays = Math.floor((today.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Définir les frais de base par type d'abonnement - ALIGNÉS AVEC LES CONSTANTES GLOBALES
  let baseFee = 0.05; // 5% par défaut (pour freemium)
  
  switch (subscription?.toLowerCase()) {
    case 'elite':
      baseFee = 0.00; // 0% pour Elite
      break;
    case 'gold':
      baseFee = 0.015; // 1.5% pour Gold
      break;
    case 'starter':
      baseFee = 0.03; // 3% pour Starter
      break;
    default:
      baseFee = 0.05; // 5% pour Freemium
  }
  
  // Réduire les frais en fonction de l'ancienneté (max 50% de réduction)
  const ageDiscount = Math.min(0.5, accountAgeInDays / 365); // 50% max après 1 an
  
  return Math.max(0.01, baseFee * (1 - ageDiscount)); // Minimum 1%
};

/**
 * Calcule combien de parrainages sont nécessaires pour atteindre le seuil de retrait
 * @param subscription Type d'abonnement
 * @param currentBalance Solde actuel
 * @returns Objet contenant le montant nécessaire et le nombre estimé de parrainages
 */
export const calculateReferralToReachThreshold = (
  subscription: string, 
  currentBalance: number
): { amountNeeded: number; estimatedReferrals: number } | null => {
  // Si le solde est déjà suffisant, retourner null
  const threshold = getWithdrawalThreshold(subscription);
  if (currentBalance >= threshold) return null;
  
  const amountNeeded = threshold - currentBalance;
  
  // Estimer le nombre de parrainages nécessaires (supposons qu'un parrainage moyen génère 10€)
  const avgCommissionPerReferral = 10;
  const estimatedReferrals = Math.ceil(amountNeeded / avgCommissionPerReferral);
  
  return {
    amountNeeded,
    estimatedReferrals
  };
};

// Export all needed constants and functions
export {
  WITHDRAWAL_THRESHOLDS,
  getWithdrawalThreshold,
  canWithdraw,
  getWithdrawalProgress,
  isWithdrawalAllowed,
  calculateWithdrawalFee,
  calculateReferralToReachThreshold
};

// Keep the default export for backward compatibility
export default {
  getWithdrawalThreshold,
  canWithdraw,
  getWithdrawalProgress,
  WITHDRAWAL_THRESHOLDS,
  isWithdrawalAllowed,
  calculateWithdrawalFee,
  calculateReferralToReachThreshold
};
