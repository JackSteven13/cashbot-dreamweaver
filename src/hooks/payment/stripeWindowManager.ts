
/**
 * Gestionnaire de fenêtre Stripe optimisé pour les mobiles et navigateurs modernes
 */

/**
 * Ouvre l'URL de paiement Stripe dans une nouvelle fenêtre/onglet
 * avec gestion améliorée pour les appareils mobiles et meilleure tolérance aux erreurs
 */
export const openStripeWindow = (url: string): boolean => {
  // Vérifications de base
  if (!url || typeof url !== 'string') {
    console.error("URL Stripe invalide ou manquante");
    return false;
  }
  
  console.log("Tentative d'ouverture de l'URL Stripe:", url);
  
  try {
    // Détection d'environnement
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isSafariMobile = isMobile && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Sur iOS ou mobile Safari, redirection directe immédiate
    if (isIOS || isSafariMobile) {
      console.log("Appareil iOS/Safari mobile détecté, redirection directe");
      window.location.href = url;
      return true;
    }
    
    // Sur mobile, tenter l'ouverture d'une nouvelle fenêtre d'abord
    if (isMobile) {
      console.log("Appareil mobile détecté, tentative d'ouverture");
      try {
        const newWindow = window.open(url, '_blank');
        if (!newWindow || newWindow.closed) {
          console.log("Échec de l'ouverture, redirection directe");
          window.location.href = url;
        }
        return true;
      } catch (e) {
        console.log("Erreur lors de l'ouverture sur mobile, redirection directe");
        window.location.href = url;
        return true;
      }
    }
    
    // Sur desktop, essayer d'ouvrir dans un nouvel onglet
    console.log("Tentative d'ouverture sur desktop");
    const stripeWindow = window.open(url, '_blank');
    
    // Vérifier si la fenêtre a été ouverte avec succès
    if (stripeWindow && !stripeWindow.closed) {
      stripeWindow.focus();
      console.log("Fenêtre Stripe ouverte avec succès");
      return true;
    }
    
    // Détection de blocage de popup
    console.warn("Échec de l'ouverture de la fenêtre - popups probablement bloqués");
    console.log("Tentative de redirection directe après 500ms");
    
    // Redirection directe après un court délai
    setTimeout(() => {
      console.log("Redirection directe vers:", url);
      window.location.href = url;
    }, 500);
    
    return true;
  } catch (error) {
    console.error("Erreur critique lors de l'ouverture de la fenêtre Stripe:", error);
    
    // Tentative de redirection directe en dernier recours
    try {
      console.log("Tentative de redirection en dernier recours");
      setTimeout(() => {
        window.location.href = url;
      }, 100);
      
      return true;
    } catch (e) {
      console.error("Échec complet de toutes les tentatives:", e);
      return false;
    }
  }
};

/**
 * Vérifie si les popups sont bloqués
 * @returns Promise<boolean> true si les popups sont bloqués, false sinon
 */
export const checkPopupBlocker = async (callback?: () => void): Promise<boolean> => {
  try {
    // Tente d'ouvrir une petite fenêtre pour vérifier si les popups sont bloqués
    const testWindow = window.open("about:blank", "_blank", "width=1,height=1");
    
    if (!testWindow || testWindow.closed || typeof testWindow.closed === 'undefined') {
      console.warn("Les popups semblent être bloqués");
      
      if (callback) {
        setTimeout(callback, 100); // Exécuter avec un léger délai
      }
      return true;
    }
    
    // Fermer la fenêtre de test immédiatement
    testWindow.close();
    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification des popups:", error);
    if (callback) callback();
    return true;
  }
};

/**
 * Force l'ouverture de l'URL Stripe avec plusieurs tentatives et méthodes
 * Cette fonction ne retourne pas tant que l'URL n'a pas été ouverte ou toutes les méthodes épuisées
 */
export const forceOpenStripeUrl = (url: string): void => {
  if (!url) return;
  
  console.log("Forçage de l'ouverture de l'URL Stripe:", url);
  
  // Enregistrer dans localStorage pour récupération ultérieure
  localStorage.setItem('stripeCheckoutUrl', url);
  localStorage.setItem('stripeRedirectPending', 'true');
  
  // Première tentative: ouverture directe
  try {
    openStripeWindow(url);
  } catch (e) {
    console.error("Première tentative échouée:", e);
    
    // Deuxième tentative après un délai
    setTimeout(() => {
      try {
        window.location.href = url;
      } catch (e2) {
        console.error("Deuxième tentative échouée:", e2);
      }
    }, 800);
  }
};
