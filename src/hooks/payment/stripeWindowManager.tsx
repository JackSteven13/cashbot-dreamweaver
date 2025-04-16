
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
  
  try {
    // Détection d'appareil mobile (plus précise)
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
    
    console.log(`Tentative d'ouverture de Stripe (${isMobile ? 'mobile' : 'desktop'}):`, stripeUrl);
    
    if (isMobile) {
      // Sur mobile, utiliser une redirection directe
      window.location.href = stripeUrl;
    } else {
      // Sur desktop, ouvrir dans un nouvel onglet
      const newWindow = window.open(stripeUrl, "_blank");
      
      // Si l'ouverture échoue (bloqueur de popup), utiliser la redirection directe
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.log("Popup bloqué, utilisation de la redirection directe");
        window.location.href = stripeUrl;
      } else {
        // Focus sur la nouvelle fenêtre
        newWindow.focus();
      }
    }
    
    // Stocker l'URL dans localStorage pour récupération éventuelle
    localStorage.setItem('lastStripeUrl', stripeUrl);
    localStorage.setItem('pendingPayment', 'true');
    localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre:", error);
    
    // Dernière tentative avec redirection directe
    window.location.href = stripeUrl;
    return true;
  }
};

/**
 * Vérifie si une fenêtre Stripe est déjà ouverte
 */
export const isStripeWindowOpen = (): boolean => {
  // Cette fonction pourrait être étendue pour vérifier si un onglet Stripe spécifique est ouvert
  return false;
};

/**
 * Récupère une session de paiement Stripe interrompue
 * Si une URL est stockée dans localStorage, tente de la récupérer
 * @returns {boolean} True si une session a été récupérée, sinon false
 */
export const recoverStripeSession = (): boolean => {
  try {
    const stripeUrl = localStorage.getItem('lastStripeUrl');
    const isPending = localStorage.getItem('pendingPayment') === 'true';
    
    if (isPending && stripeUrl) {
      console.log("Tentative de récupération d'une session Stripe:", stripeUrl);
      return openStripeWindow(stripeUrl);
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la récupération de session:", error);
    return false;
  }
};
