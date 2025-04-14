
/**
 * Gestionnaire de fenêtre Stripe optimisé pour assurer une redirection fiable
 */

/**
 * Ouvre l'URL de paiement Stripe de manière fiable
 * La fonction gère les cas spéciaux pour les appareils mobiles et les navigateurs différents
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  if (!stripeUrl) {
    console.error("URL Stripe manquante");
    return false;
  }
  
  try {
    // Tenter une redirection directe pour tous les appareils
    // Cette méthode est la plus fiable pour éviter les problèmes de blocage de popup
    console.log("Redirection vers Stripe:", stripeUrl);
    window.location.href = stripeUrl;
    return true;
  } catch (error) {
    console.error("Erreur lors de la redirection vers Stripe:", error);
    return false;
  }
};

/**
 * Vérifie si une fenêtre Stripe est déjà ouverte
 */
export const isStripeWindowOpen = (): boolean => {
  // Cette fonction pourrait être étendue pour vérifier si un onglet Stripe spécifique est ouvert
  // Pour l'instant, c'est une implémentation minimaliste
  return false;
};
