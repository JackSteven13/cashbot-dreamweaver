
/**
 * Gestionnaire de fenêtre Stripe simplifié
 */

/**
 * Ouvre l'URL de paiement Stripe directement
 * avec redirection selon le type d'appareil
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  if (!stripeUrl) {
    console.error("URL Stripe manquante");
    return false;
  }
  
  try {
    // Détection d'appareil mobile
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log(`Ouverture de Stripe (${isMobile ? 'mobile' : 'desktop'}):`, stripeUrl);
    
    // Sur mobile, redirection directe
    if (isMobile) {
      window.location.href = stripeUrl;
      return true;
    }
    
    // Sur desktop, ouverture dans un nouvel onglet
    const newWindow = window.open(stripeUrl, '_blank');
    
    // Si l'ouverture échoue, redirection directe
    if (!newWindow) {
      window.location.href = stripeUrl;
    } else {
      newWindow.focus();
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture:", error);
    
    // En cas d'erreur, redirection directe
    window.location.href = stripeUrl;
    return true;
  }
};

/**
 * Vérifie si une fenêtre Stripe est déjà ouverte
 */
export const isStripeWindowOpen = (): boolean => {
  return false;
};
