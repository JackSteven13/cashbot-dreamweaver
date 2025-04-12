
/**
 * Ouvre une fenêtre Stripe de manière fiable
 * Gère les cas spécifiques pour mobile et desktop
 */
export const openStripeWindow = (url: string): boolean => {
  if (!url) {
    console.error("URL invalide pour le paiement Stripe");
    return false;
  }
  
  try {
    console.log("Tentative d'ouverture de la fenêtre Stripe");
    
    // Test si nous sommes sur mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Sur mobile, on redirige directement
      console.log("Appareil mobile détecté, redirection directe");
      window.location.href = url;
      return true;
    }
    
    // Sur desktop, on essaie d'ouvrir dans une nouvelle fenêtre
    const stripeWindow = window.open(url, '_blank');
    
    // Vérifier si la fenêtre a été ouverte avec succès
    if (stripeWindow) {
      stripeWindow.focus();
      return true;
    }
    
    // Si l'ouverture de la fenêtre a échoué (popup bloqué), on redirige directement
    console.warn("Impossible d'ouvrir une nouvelle fenêtre, tentative de redirection directe");
    window.location.href = url;
    return true;
    
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre Stripe:", error);
    
    // En cas d'erreur, on essaie quand même la redirection directe
    try {
      window.location.href = url;
      return true;
    } catch (e) {
      console.error("Échec de la redirection directe:", e);
      return false;
    }
  }
};
