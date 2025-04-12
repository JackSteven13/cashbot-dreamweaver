
/**
 * Gestionnaire pour l'ouverture des fenêtres Stripe
 * Résout les problèmes d'ouverture de popup bloqués
 */

// Fenêtre de paiement Stripe active
let activeStripeWindow: Window | null = null;

/**
 * Ouvre une fenêtre Stripe de manière fiable
 * @param stripeUrl URL de la page de checkout Stripe
 * @returns boolean indiquant si la fenêtre a été ouverte avec succès
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  // Si une fenêtre est déjà ouverte, la fermer d'abord
  if (activeStripeWindow && !activeStripeWindow.closed) {
    try {
      activeStripeWindow.focus();
      return true;
    } catch (e) {
      console.log("Impossible de refocaliser la fenêtre Stripe existante, ouverture d'une nouvelle fenêtre");
    }
  }
  
  try {
    // Essayer d'abord d'ouvrir dans un nouvel onglet
    const newWindow = window.open(stripeUrl, '_blank');
    
    // Vérifier si la fenêtre a été ouverte avec succès
    if (newWindow && !newWindow.closed) {
      activeStripeWindow = newWindow;
      return true;
    }
    
    // Si l'onglet n'a pas pu être ouvert, essayer la redirection
    console.log("L'ouverture d'un nouvel onglet a échoué, tentative de redirection directe");
    window.location.href = stripeUrl;
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre Stripe:", error);
    
    // En dernier recours, essayer la redirection directe
    try {
      window.location.href = stripeUrl;
      return true;
    } catch (e) {
      console.error("La redirection vers Stripe a également échoué:", e);
      return false;
    }
  }
};

/**
 * Vérifie si une fenêtre Stripe est active
 * @returns true si une fenêtre Stripe est actuellement ouverte
 */
export const isStripeWindowActive = (): boolean => {
  return activeStripeWindow !== null && !activeStripeWindow.closed;
};

/**
 * Ferme la fenêtre Stripe active
 */
export const closeStripeWindow = (): void => {
  if (activeStripeWindow && !activeStripeWindow.closed) {
    activeStripeWindow.close();
  }
  activeStripeWindow = null;
};
