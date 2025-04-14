
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
  
  // Détection d'appareil mobile plus précise
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
  
  console.log(`Tentative d'ouverture de Stripe (${isMobile ? 'mobile' : 'desktop'}):`, stripeUrl);
  
  try {
    if (isMobile) {
      // Sur mobile, toujours utiliser la redirection directe
      console.log("Appareil mobile détecté, redirection directe");
      window.location.href = stripeUrl;
      return true;
    }
    
    // Pour desktop et tablette, d'abord essayer un nouvel onglet
    const newWindow = window.open(stripeUrl, '_blank', 'noopener,noreferrer');
    
    // Vérifier si l'ouverture a réussi
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.log("Ouverture nouvel onglet échouée, tente redirection avec lien");
      
      // Tenter avec un lien et un événement de clic simulé
      const link = document.createElement('a');
      link.href = stripeUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Vérifier après un court délai si la fenêtre a été bloquée
      setTimeout(() => {
        if (!newWindow || newWindow.closed) {
          console.log("Redirection lien échouée aussi, tentative redirection directe");
          window.location.href = stripeUrl;
        }
      }, 1000);
      
      return true;
    } else {
      console.log("Nouvel onglet ouvert avec succès");
      newWindow.focus();
      return true;
    }
  } catch (error) {
    console.error("Erreur lors de l'ouverture de Stripe:", error);
    
    // En cas d'erreur, tenter la redirection directe
    try {
      console.log("Erreur détectée, tentative de redirection directe");
      window.location.href = stripeUrl;
      return true;
    } catch (e) {
      console.error("Échec de toutes les méthodes de redirection:", e);
      return false;
    }
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
