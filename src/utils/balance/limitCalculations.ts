
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
  // Utiliser une marge de sécurité de 1%
  return currentAmount >= (dailyLimit * 0.99);
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

/**
 * Calcule le niveau d'avertissement basé sur le pourcentage d'utilisation
 */
export const calculateLimitWarningLevel = (
  percentage: number,
  dailyLimit: number,
  currentGains: number
): {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
} => {
  const remaining = calculateRemainingAmount(currentGains, dailyLimit);
  
  if (percentage >= 99) {
    return {
      level: 'critical',
      message: `Limite atteinte! Revenez demain ou passez à un forfait supérieur.`
    };
  } else if (percentage >= 90) {
    return {
      level: 'high',
      message: `Vous avez presque atteint votre limite quotidienne. Il vous reste ${formatPrice(remaining)}.`
    };
  } else if (percentage >= 75) {
    return {
      level: 'medium',
      message: `Vous approchez de votre limite quotidienne. Il vous reste ${formatPrice(remaining)}.`
    };
  } else if (percentage >= 50) {
    return {
      level: 'low',
      message: `Vous avez utilisé la moitié de votre limite quotidienne. Il reste ${formatPrice(remaining)}.`
    };
  }
  
  return {
    level: 'none',
    message: ''
  };
};

/**
 * Détermine si les sessions manuelles doivent être désactivées
 */
export const shouldDisableSessions = (
  percentage: number,
  subscription: string
): boolean => {
  // Pour les comptes freemium, désactiver dès 95%
  if (subscription === 'freemium') {
    return percentage >= 95;
  }
  
  // Pour les autres abonnements, désactiver à 99%
  return percentage >= 99;
};

/**
 * Détermine si le bot automatique doit être désactivé
 */
export const shouldDisableBot = (
  percentage: number,
  subscription: string
): boolean => {
  // Pour les comptes freemium, désactiver dès 85%
  if (subscription === 'freemium') {
    return percentage >= 85;
  }
  
  // Pour les autres abonnements, désactiver à 90%
  return percentage >= 90;
};
