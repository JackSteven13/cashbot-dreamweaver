
/**
 * Détermine le nombre maximum de sessions par jour en fonction de l'abonnement
 */
export function getMaxSessionsForSubscription(subscription: string): number {
  switch (subscription) {
    case 'starter':
    case 'alpha':
      return 12;
    case 'gold':
      return 24;
    case 'elite':
      return 50;
    case 'freemium':
    default:
      return 5;
  }
}

/**
 * Formate un prix en euros
 */
export function formatPrice(price: number): string {
  return `${price.toFixed(2)}€`;
}

/**
 * Calcule le prix au prorata en fonction du temps restant dans le mois
 */
export function calculateProratedPrice(basePrice: number): number {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - today.getDate();
  
  return Math.max((basePrice * daysRemaining) / daysInMonth, basePrice * 0.1);
}
