
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
      // Sur mobile, utiliser la redirection directe sans délai
      console.log("Appareil mobile détecté, redirection directe immédiate");
      // Forcer l'ouverture dans la même fenêtre pour les appareils mobiles
      window.location.href = stripeUrl;
      return true;
    }
    
    // Sur desktop, essayer d'abord d'ouvrir dans un nouvel onglet
    const newWindow = window.open(stripeUrl, '_blank', 'noopener,noreferrer');
    
    // Si l'ouverture échoue (bloqué par popup blocker ou autre)
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.log("Ouverture de nouvelle fenêtre échouée, tentative de redirection directe");
      
      // Création d'un élément a avec target _blank pour simuler un clic utilisateur
      const link = document.createElement('a');
      link.href = stripeUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      
      // Si ça échoue aussi, redirection directe
      setTimeout(() => {
        if (!newWindow || newWindow.closed) {
          console.log("Seconde tentative échouée, redirection directe");
          window.location.href = stripeUrl;
        }
      }, 1000);
      
      return true;
    } else {
      // Focus sur la nouvelle fenêtre
      newWindow.focus();
      console.log("Nouvelle fenêtre ouverte avec succès");
      return true;
    }
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre:", error);
    
    // Dernière tentative avec redirection directe
    console.log("Méthode de secours: redirection directe après erreur");
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
