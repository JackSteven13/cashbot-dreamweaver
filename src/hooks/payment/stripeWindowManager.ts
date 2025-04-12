
/**
 * Gestionnaire sécurisé pour les interactions avec la fenêtre Stripe
 */

// Référence à la fenêtre Stripe ouverte
let stripeWindow: Window | null = null;
let openAttempts: number = 0;
let isOpeningInProgress: boolean = false;

/**
 * Ouvre la fenêtre Stripe de manière sécurisée avec gestion des erreurs
 * @param url URL de la session Stripe Checkout
 */
export const openStripeWindow = (url: string): boolean => {
  try {
    if (!url) {
      console.error("URL Stripe invalide");
      return false;
    }
    
    // Protection contre les clics multiples
    if (isOpeningInProgress) {
      console.log("Ouverture déjà en cours, ignorer les clics supplémentaires");
      return true;
    }
    
    isOpeningInProgress = true;
    
    // Fermer toute fenêtre existante pour éviter les doublons
    if (stripeWindow && !stripeWindow.closed) {
      stripeWindow.close();
    }
    
    // Configurer les paramètres d'ouverture pour une meilleure expérience utilisateur
    const windowFeatures = "width=600,height=700,menubar=no,toolbar=no,location=yes,status=yes";
    
    // Ouvrir une nouvelle fenêtre avec gestion des erreurs
    stripeWindow = window.open(url, "stripe_checkout", windowFeatures);
    
    // Vérifier si la fenêtre a bien été ouverte
    if (!stripeWindow) {
      // Si la fenêtre n'a pas pu être ouverte, effectuer jusqu'à 3 tentatives supplémentaires
      if (openAttempts < 3) {
        openAttempts++;
        console.log(`Nouvelle tentative d'ouverture (${openAttempts}/3)...`);
        
        // Petite pause avant de réessayer
        setTimeout(() => {
          isOpeningInProgress = false;
          openStripeWindow(url);
        }, 200);
        return true;
      }
      
      console.error("Impossible d'ouvrir la fenêtre Stripe après plusieurs tentatives");
      isOpeningInProgress = false;
      return false;
    }
    
    // Réinitialiser le compteur de tentatives
    openAttempts = 0;
    
    // Mettre le focus sur la fenêtre
    stripeWindow.focus();
    
    // Ajouter un gestionnaire pour détecter la fermeture
    const checkClosed = setInterval(() => {
      if (stripeWindow && stripeWindow.closed) {
        clearInterval(checkClosed);
        console.log("Fenêtre Stripe fermée par l'utilisateur");
        isOpeningInProgress = false;
      }
    }, 500);
    
    // Terminer l'état d'ouverture après un court délai
    setTimeout(() => {
      isOpeningInProgress = false;
    }, 1000);
    
    console.log("Fenêtre Stripe ouverte avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre Stripe:", error);
    isOpeningInProgress = false;
    return false;
  }
};

/**
 * Vérifie si la fenêtre Stripe est actuellement ouverte
 */
export const isStripeWindowOpen = (): boolean => {
  return !!stripeWindow && !stripeWindow.closed;
};

/**
 * Ferme la fenêtre Stripe si elle est ouverte
 */
export const closeStripeWindow = (): void => {
  if (stripeWindow && !stripeWindow.closed) {
    stripeWindow.close();
    stripeWindow = null;
  }
  isOpeningInProgress = false;
};

/**
 * Ajoute un timeout pour fermer automatiquement la fenêtre si l'utilisateur n'interagit pas
 */
export const setupStripeWindowTimeout = (timeoutMs: number = 180000): void => {
  if (stripeWindow) {
    setTimeout(() => {
      if (stripeWindow && !stripeWindow.closed) {
        console.log("Fermeture automatique de la fenêtre Stripe après timeout");
        stripeWindow.close();
        stripeWindow = null;
        isOpeningInProgress = false;
      }
    }, timeoutMs);
  }
};
