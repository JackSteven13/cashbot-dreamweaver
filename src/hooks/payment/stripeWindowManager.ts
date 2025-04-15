
/**
 * Gestionnaire de fenêtre Stripe optimisé pour les mobiles et navigateurs modernes
 * avec priorité à la performance et à la fiabilité
 */

/**
 * Ouvre l'URL de paiement Stripe dans une nouvelle fenêtre/onglet
 * avec gestion spécifique selon le type d'appareil et de navigateur
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  if (!stripeUrl) {
    console.error("URL Stripe manquante");
    return false;
  }
  
  try {
    // Détection d'appareil mobile plus précise incluant tablettes
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
    
    console.log(`Tentative d'ouverture de Stripe (${isMobile ? 'mobile' : 'desktop'}):`, stripeUrl);
    
    // Sur mobile, utiliser une redirection directe immédiate pour performance maximale
    if (isMobile) {
      console.log("Appareil mobile détecté, redirection directe prioritaire");
      window.location.href = stripeUrl;
      return true;
    }
    
    // Sur desktop, ouvrir dans un nouvel onglet avec focus immédiat
    const newWindow = window.open(stripeUrl, '_blank');
    
    if (newWindow && !newWindow.closed && typeof newWindow.closed !== 'undefined') {
      // Focus sur la nouvelle fenêtre pour attirer l'attention de l'utilisateur
      newWindow.focus();
      console.log("Nouvelle fenêtre Stripe ouverte avec succès");
      return true;
    }
    
    // Si blocage de popup, utiliser des méthodes alternatives
    console.log("Ouverture de nouvelle fenêtre échouée, tentative alternative");
    
    // Méthode 1: Simuler un clic utilisateur
    const link = document.createElement('a');
    link.href = stripeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none'; // Masquer l'élément
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Méthode 2: Si toujours pas ouvert après 100ms, faire une redirection directe
    setTimeout(() => {
      window.location.href = stripeUrl;
    }, 100);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre Stripe:", error);
    
    // Méthode de secours: redirection directe
    window.location.href = stripeUrl;
    return true;
  }
};

/**
 * Vérifie si une fenêtre Stripe est déjà ouverte
 */
export const isStripeWindowOpen = (): boolean => {
  return false; // Fonctionnalité réservée pour implémentation future
};
