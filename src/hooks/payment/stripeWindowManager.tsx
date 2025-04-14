
/**
 * Gestionnaire de fenêtre Stripe optimisé pour les mobiles et navigateurs modernes
 */

/**
 * Ouvre l'URL de paiement Stripe dans une nouvelle fenêtre/onglet
 * avec gestion améliorée pour les appareils mobiles
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  if (!stripeUrl) {
    console.error("URL Stripe manquante");
    return false;
  }
  
  // Indiquer au navigateur que l'action provient d'un clic utilisateur
  console.log("Ouverture de l'URL Stripe:", stripeUrl);
  
  try {
    // Détection d'appareil mobile
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Sur appareils mobiles, la redirection directe fonctionne mieux
      console.log("Appareil mobile détecté, redirection directe");
      window.location.href = stripeUrl;
      return true;
    }
    
    // Pour les autres appareils, essayer d'abord d'ouvrir une nouvelle fenêtre
    const newWindow = window.open(stripeUrl, '_blank');
    
    // Si l'ouverture a échoué (bloquée par popup blocker ou autre problème)
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.log("Ouverture de nouvelle fenêtre échouée, redirection directe");
      
      // Redirection directe en dernier recours
      window.location.href = stripeUrl;
      return true;
    } else {
      // Focus sur la nouvelle fenêtre
      newWindow.focus();
      console.log("Nouvelle fenêtre ouverte avec succès");
      return true;
    }
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre:", error);
    
    // Méthode de dernier recours avec délai pour éviter les problèmes
    console.log("Méthode de secours: redirection directe");
    window.location.href = stripeUrl;
    return true;
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
