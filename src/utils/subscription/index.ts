
// Exporter les fonctions liées à la gestion des abonnements
export { shouldResetDailyCounters } from './subscriptionStatus';
export { canStartManualSession } from './sessionManagement';
export { calculateManualSessionGain, calculateAutoSessionGain, calculateSessionGain } from './sessionGain';

// Re-export des constantes liées aux abonnements
export { SUBSCRIPTION_LIMITS, MANUAL_SESSION_GAIN_PERCENTAGES } from './constants';
export { getEffectiveSubscription, checkDailyLimit } from './subscriptionStatus';

// Re-export des fonctions d'authentification depuis subscriptionUtils pour assurer la compatibilité
export { subscribeToAuthChanges, unsubscribeFromAuthChanges } from '@/utils/auth/subscriptionUtils';
