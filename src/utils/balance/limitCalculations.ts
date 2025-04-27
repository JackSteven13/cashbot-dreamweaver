
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

/**
 * Affiche un texte descriptif de l'état de la limite
 */
export const getLimitStatus = (
  currentAmount: number,
  dailyLimit: number
): { text: string; color: string } => {
  const percentage = calculateUsagePercentage(currentAmount, dailyLimit);
  
  if (percentage >= 100) {
    return { 
      text: 'Limite journalière atteinte', 
      color: 'text-red-500'
    };
  }
  
  if (percentage >= 90) {
    return { 
      text: 'Limite presque atteinte', 
      color: 'text-red-500'
    };
  }
  
  if (percentage >= 75) {
    return { 
      text: 'Limite avancée', 
      color: 'text-yellow-500'
    };
  }
  
  if (percentage >= 50) {
    return { 
      text: 'Limite à mi-chemin', 
      color: 'text-blue-500'
    };
  }
  
  return { 
    text: 'Limite confortable', 
    color: 'text-green-500'
  };
};

/**
 * Formate le temps restant jusqu'à la réinitialisation des limites
 */
export const getTimeUntilReset = (): string => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeLeft = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

/**
 * Obtient l'état détaillé des limitations pour un utilisateur
 */
export const getDailyLimitDetails = (
  currentAmount: number,
  dailyLimit: number,
  subscription: string
): {
  percentage: number;
  remaining: number;
  isLimitReached: boolean;
  status: { text: string; color: string };
  resetTime: string;
  formattedCurrent: string;
  formattedLimit: string;
  formattedRemaining: string;
  subscription: string;
} => {
  const percentage = calculateUsagePercentage(currentAmount, dailyLimit);
  const remaining = calculateRemainingAmount(currentAmount, dailyLimit);
  const limitReached = isLimitReached(currentAmount, dailyLimit);
  const status = getLimitStatus(currentAmount, dailyLimit);
  const resetTime = getTimeUntilReset();
  
  return {
    percentage,
    remaining,
    isLimitReached: limitReached,
    status,
    resetTime,
    formattedCurrent: formatPrice(currentAmount),
    formattedLimit: formatPrice(dailyLimit),
    formattedRemaining: formatPrice(remaining),
    subscription: subscription.charAt(0).toUpperCase() + subscription.slice(1)
  };
};
