
/**
 * Utilitaires liés aux seuils de retrait selon le niveau d'abonnement
 */

// Seuils de retrait par type d'abonnement
const WITHDRAWAL_THRESHOLDS = {
  freemium: 200,
  starter: 150,
  gold: 100,
  elite: 50,
  // Fallback
  default: 200
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

export default {
  getWithdrawalThreshold,
  canWithdraw,
  getWithdrawalProgress,
  WITHDRAWAL_THRESHOLDS
};
