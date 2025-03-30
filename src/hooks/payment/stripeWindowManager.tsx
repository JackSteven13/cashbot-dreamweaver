
/**
 * Gestionnaire de fenêtre Stripe optimisé pour les mobiles et navigateurs modernes
 */

/**
 * Ouvre l'URL de paiement Stripe dans une nouvelle fenêtre/onglet
 * Utilise plusieurs méthodes pour maximiser la compatibilité sur mobile
 */
export const openStripeWindow = (stripeUrl: string): void => {
  // Indiquer au navigateur que l'action provient d'un clic utilisateur
  console.log("Tentative d'ouverture de l'URL Stripe:", stripeUrl);
  
  try {
    // Première méthode: window.open dans un nouvel onglet
    const newWindow = window.open(stripeUrl, '_blank');
    
    // Si l'ouverture a échoué (bloquée par popup blocker)
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.log("Méthode 1 échouée (popup bloquée), essai méthode 2");
      
      // Deuxième méthode: redirection directe
      window.location.href = stripeUrl;
    } else {
      // Focus sur la nouvelle fenêtre
      newWindow.focus();
      console.log("Nouvelle fenêtre ouverte avec succès");
    }
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre:", error);
    
    // Méthode de dernier recours
    console.log("Méthode de secours: redirection directe");
    window.location.href = stripeUrl;
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
