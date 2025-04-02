
// Export les fonctions de gestion des abonnements
export { 
  SUBSCRIPTION_LIMITS,
  MANUAL_SESSION_GAIN_PERCENTAGES 
} from './constants';

export { 
  normalizeSubscription,
  getEffectiveSubscription,
  checkDailyLimit
} from './subscriptionStatus';

export {
  canStartManualSession
} from './sessionManagement';

export {
  calculateManualSessionGain,
  calculateAutoSessionGain
} from './sessionGain';

// Fonctions de gestion des événements d'authentification
export const subscribeToAuthChanges = (callback: (event: string, session: any) => void): { unsubscribe: () => void } => {
  // Implémentation simple pour éviter les erreurs
  console.log("Abonnement aux changements d'authentification");
  
  // Retourne un objet avec une méthode unsubscribe
  return {
    unsubscribe: () => {
      console.log("Désabonnement des changements d'authentification");
    }
  };
};

export const unsubscribeFromAuthChanges = (subscription: { unsubscribe: () => void }) => {
  if (subscription && typeof subscription.unsubscribe === 'function') {
    subscription.unsubscribe();
  }
};
