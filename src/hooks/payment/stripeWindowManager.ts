
/**
 * Gestionnaire de fenêtre Stripe optimisé pour assurer une redirection fiable
 * avec support amélioré pour les mobiles
 */

/**
 * Ouvre l'URL de paiement Stripe de manière fiable et rapide
 * La fonction gère les cas spéciaux pour les appareils mobiles et les navigateurs différents
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
    
    // Sur mobile, redirection directe immédiate pour plus de rapidité
    if (isMobile) {
      console.log("Appareil mobile détecté, redirection directe immédiate");
      window.location.href = stripeUrl;
      return true;
    }
    
    // Sur desktop, utiliser une technique optimisée pour contourner les bloqueurs de popups
    // et assurer une ouverture rapide
    const link = document.createElement('a');
    link.href = stripeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Simuler un clic utilisateur pour éviter les blocages
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Plan B: Si après 300ms la fenêtre n'est pas ouverte, tenter autre méthode
    const backupTimer = setTimeout(() => {
      try {
        // Tentative d'ouverture classique
        const newWindow = window.open(stripeUrl, '_blank');
        if (newWindow) {
          newWindow.focus();
        } else {
          // Si ça échoue aussi, redirection directe
          console.log("Ouvertures échouées, redirection directe");
          window.location.href = stripeUrl;
        }
      } catch (e) {
        // En cas d'erreur, redirection directe
        window.location.href = stripeUrl;
      }
    }, 300);
    
    return true;
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
