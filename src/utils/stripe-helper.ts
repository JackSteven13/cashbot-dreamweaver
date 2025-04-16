
/**
 * Utilitaires optimisés pour l'intégration avec Stripe et la gestion mobile
 */

/**
 * Détecte si l'appareil est un mobile pour adapter l'expérience
 */
export const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
};

/**
 * S'assure que l'URL Stripe est valide et complète
 */
export const fixStripeUrl = (url: string): string => {
  if (!url) return url;
  
  // S'assurer que l'URL commence par https://
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }
  
  return url;
};

/**
 * Nettoie les paramètres de l'URL pour éviter les problèmes avec certains navigateurs
 */
export const cleanStripeUrl = (url: string): string => {
  if (!url) return url;
  
  // Supprimer les paramètres problématiques qui peuvent causer des redirections en boucle
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('succeeded');
    urlObj.searchParams.delete('canceled');
    return urlObj.toString();
  } catch (e) {
    return url;
  }
};

/**
 * Vérifie si un paiement est en cours et doit être repris
 */
export const hasPendingStripePayment = (): boolean => {
  const isPending = localStorage.getItem('pendingPayment') === 'true';
  const url = localStorage.getItem('lastStripeUrl');
  const timestamp = parseInt(localStorage.getItem('stripeRedirectTimestamp') || '0');
  
  // Vérifier si le paiement est en cours et que l'URL n'est pas trop ancienne (30 min max)
  return isPending && !!url && (Date.now() - timestamp < 30 * 60 * 1000);
};

/**
 * Force l'URL de succès à être absolue
 */
export const getAbsoluteSuccessUrl = (): string => {
  return `${window.location.origin}/payment-success`;
};

/**
 * Force l'URL d'annulation à être absolue
 */
export const getAbsoluteCancelUrl = (): string => {
  return `${window.location.origin}/offres`;
};
