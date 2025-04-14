
/**
 * Ouvre une fenêtre Stripe de manière fiable
 */
export const openStripeWindow = (url: string): boolean => {
  try {
    // Tentative d'ouverture dans un nouvel onglet
    const stripeWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Vérifier si la fenêtre a été ouverte avec succès
    if (stripeWindow) {
      stripeWindow.focus();
      return true;
    }
    
    // Si l'ouverture a échoué mais que nous sommes sur mobile, rediriger directement
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      console.log("Redirection mobile vers Stripe");
      // Sur mobile, ouvrir dans la même fenêtre peut être plus fiable
      window.location.href = url;
      return true;
    }
    
    // Échec de l'ouverture
    console.error("Impossible d'ouvrir la fenêtre Stripe");
    return false;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre Stripe:", error);
    
    // Tentative de redirection directe en dernier recours
    try {
      window.location.href = url;
      return true;
    } catch (e) {
      return false;
    }
  }
};
