
/**
 * Formatage d'un montant en euros
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Calcule le pourcentage d'utilisation de la limite quotidienne
 */
export const calculateUsagePercentage = (
  currentAmount: number,
  dailyLimit: number
): number => {
  if (dailyLimit <= 0) return 0;
  const percentage = (currentAmount / dailyLimit) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp entre 0 et 100
};

/**
 * Détermine la couleur en fonction de l'utilisation
 */
export const getUsageColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-red-500';
  if (percentage >= 75) return 'text-yellow-500';
  return 'text-green-500';
};

/**
 * Vérifie si l'utilisateur a atteint sa limite quotidienne
 */
export const isLimitReached = (
  currentAmount: number,
  dailyLimit: number
): boolean => {
  return currentAmount >= dailyLimit;
};

/**
 * Calcule le montant restant pour atteindre la limite
 */
export const calculateRemainingAmount = (
  currentAmount: number,
  dailyLimit: number
): number => {
  return Math.max(dailyLimit - currentAmount, 0);
};
