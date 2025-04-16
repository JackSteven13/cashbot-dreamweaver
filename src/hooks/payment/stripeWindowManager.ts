
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
      // Sur mobile, utiliser un délai avant redirection pour permettre à l'animation de transition de s'exécuter
      console.log("Appareil mobile détecté, préparation de la redirection...");
      
      // Forcer l'ouverture dans la même fenêtre après une courte animation
      localStorage.setItem('stripeRedirecting', 'true');
      
      setTimeout(() => {
        window.location.href = stripeUrl;
      }, 500);
      
      return true;
    }
    
    // Sur desktop, essayer d'abord d'ouvrir dans un nouvel onglet avec délai
    setTimeout(() => {
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
        
        // Si ça échoue aussi, redirection directe après un court délai
        setTimeout(() => {
          if (!newWindow || newWindow.closed) {
            console.log("Seconde tentative échouée, redirection directe");
            window.location.href = stripeUrl;
          }
        }, 500);
      } else {
        // Focus sur la nouvelle fenêtre
        newWindow.focus();
        console.log("Nouvelle fenêtre ouverte avec succès");
      }
    }, 500); // Délai pour permettre à l'animation de se terminer
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre:", error);
    
    // Dernière tentative avec redirection directe après délai
    setTimeout(() => {
      console.log("Méthode de secours: redirection directe après erreur");
      window.location.href = stripeUrl;
    }, 500);
    
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
 * Essaie de récupérer une session de paiement interrompue
 */
export const recoverStripeSession = (): boolean => {
  const lastUrl = localStorage.getItem('lastStripeUrl');
  const timestamp = parseInt(localStorage.getItem('stripeRedirectTimestamp') || '0', 10);
  
  // Vérifier si l'URL n'est pas trop ancienne (30 minutes max)
  if (lastUrl && Date.now() - timestamp < 30 * 60 * 1000) {
    console.log("Tentative de récupération de session Stripe:", lastUrl);
    return openStripeWindow(lastUrl);
  }
  
  return false;
};

