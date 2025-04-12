
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
