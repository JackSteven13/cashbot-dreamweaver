
// Importer et ré-exporter depuis le module de subscription
import { 
  SUBSCRIPTION_LIMITS, 
  getEffectiveSubscription as getEffectiveSubscriptionOriginal,
  checkDailyLimit
} from './subscription';

// Ré-exporter les fonctions et constantes
export const SUBSCRIPTION_LIMITS = SUBSCRIPTION_LIMITS;
export const getEffectiveSubscription = getEffectiveSubscriptionOriginal;
export const checkDailyLimit = checkDailyLimit;

// Fonctions supplémentaires spécifiques à ce fichier
export const getSubscriptionName = (subscriptionCode: string): string => {
  switch (subscriptionCode) {
    case 'freemium':
      return 'Freemium';
    case 'starter':
      return 'Starter';
    case 'gold':
      return 'Gold';
    case 'elite':
      return 'Elite';
    default:
      return 'Abonnement inconnu';
  }
};

export const getMaxSessionsPerDay = (subscription: string): number => {
  switch (subscription) {
    case 'freemium':
      return 1;
    case 'starter':
      return 10;
    case 'gold':
      return 30;
    case 'elite':
      return 60;
    default:
      return 1;
  }
};
