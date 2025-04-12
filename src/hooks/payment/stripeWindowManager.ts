
/**
 * Gestionnaire sécurisé pour les interactions avec la fenêtre Stripe
 */

// Référence à la fenêtre Stripe ouverte
let stripeWindow: Window | null = null;

/**
 * Ouvre la fenêtre Stripe de manière sécurisée
 * @param url URL de la session Stripe Checkout
 */
export const openStripeWindow = (url: string): boolean => {
  try {
    if (!url) {
      console.error("URL Stripe invalide");
      return false;
    }
    
    // Fermer toute fenêtre existante pour éviter les doublons
    if (stripeWindow && !stripeWindow.closed) {
      stripeWindow.close();
    }
    
    // Configurer les paramètres d'ouverture pour une meilleure expérience utilisateur
    const windowFeatures = "width=600,height=700,menubar=no,toolbar=no,location=yes,status=yes";
    
    // Ouvrir une nouvelle fenêtre
    stripeWindow = window.open(url, "stripe_checkout", windowFeatures);
    
    // Vérifier si la fenêtre a bien été ouverte
    if (!stripeWindow) {
      console.error("Impossible d'ouvrir la fenêtre Stripe");
      return false;
    }
    
    // Mettre le focus sur la fenêtre
    stripeWindow.focus();
    
    console.log("Fenêtre Stripe ouverte avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre Stripe:", error);
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
      }
    }, timeoutMs);
  }
};
