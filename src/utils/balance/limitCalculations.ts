
import { SUBSCRIPTION_LIMITS } from '../subscription/constants';

/**
 * Format a price value to EUR currency
 * @param value Number to format as currency
 * @returns Formatted string with Euro currency symbol
 */
export const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Calculate the warning level based on daily limit percentage
 */
export const calculateLimitWarningLevel = (
  percentage: number, 
  dailyLimit: number, 
  dailyGains: number
): { 
  level: 'none' | 'low' | 'medium' | 'high' | 'critical', 
  message: string 
} => {
  if (percentage >= 99) {
    return {
      level: 'critical',
      message: `Limite atteinte: ${dailyGains.toFixed(2)}€/${dailyLimit}€`
    };
  } else if (percentage >= 90) {
    return {
      level: 'high',
      message: `Limite presque atteinte: ${dailyGains.toFixed(2)}€/${dailyLimit}€`
    };
  } else if (percentage >= 75) {
    return {
      level: 'medium',
      message: `Attention: vous approchez de votre limite quotidienne`
    };
  } else if (percentage >= 50) {
    return {
      level: 'low',
      message: `Vous avez utilisé la moitié de votre limite`
    };
  }
  
  return {
    level: 'none',
    message: ''
  };
};

/**
 * Get the daily limit for a subscription
 */
export const getDailyLimit = (subscription: string): number => {
  const effectiveSubscription = subscription || 'freemium';
  return SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
};

