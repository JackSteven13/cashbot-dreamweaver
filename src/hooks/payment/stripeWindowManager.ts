
/**
 * Gestionnaire amélioré de fenêtre Stripe optimisé pour les mobiles et navigateurs modernes
 * avec mécanismes de contournement des blocages de popups
 */

/**
 * Ouvre l'URL de paiement Stripe de façon optimisée pour les appareils mobiles
 * avec multiples mécanismes de secours en cas d'échec
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  if (!stripeUrl) {
    console.error("URL Stripe manquante");
    return false;
  }
  
  try {
    // Détection d'appareil mobile plus complète
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
    
    console.log(`Tentative d'ouverture de Stripe (${isMobile ? 'mobile' : 'desktop'}):`, stripeUrl);
    
    // PRIORITÉ N°1: Sur mobile, redirection directe immédiate
    if (isMobile) {
      console.log("Appareil mobile détecté, redirection directe");
      
      // Mécanisme principal: redirection directe sans délai
      window.location.href = stripeUrl;
      
      // Sauvegarder l'URL pour récupération en cas d'erreur
      localStorage.setItem('lastStripeUrl', stripeUrl);
      localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
      localStorage.setItem('pendingPayment', 'true');
      
      // Attente minimale avant de retourner true pour donner du temps à la redirection
      return true;
    }
    
    // PRIORITÉ N°2: Sur desktop, tenter d'abord une nouvelle fenêtre
    const newWindow = window.open(stripeUrl, '_blank', 'noopener,noreferrer');
    
    if (newWindow && !newWindow.closed && typeof newWindow.closed !== 'undefined') {
      // Fenêtre ouverte avec succès
      newWindow.focus();
      
      // Sauvegarder quand même l'URL pour récupération ultérieure si nécessaire
      localStorage.setItem('lastStripeUrl', stripeUrl);
      localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
      localStorage.setItem('pendingPayment', 'true');
      
      console.log("Nouvelle fenêtre Stripe ouverte avec succès");
      return true;
    }
    
    // PRIORITÉ N°3: Si blocage de popup, essayer un autre mécanisme
    console.log("Ouverture de fenêtre échouée, tentative alternative");
    
    // Créer un élément <a> invisible et simuler un clic
    const link = document.createElement('a');
    link.href = stripeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Sauvegarder l'URL pour récupération ultérieure
    localStorage.setItem('lastStripeUrl', stripeUrl);
    localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
    localStorage.setItem('pendingPayment', 'true');
    
    // PRIORITÉ N°4: Redirection directe en dernier recours (après un court délai)
    setTimeout(() => {
      window.location.href = stripeUrl;
    }, 300);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de Stripe:", error);
    
    // En cas d'erreur, redirection directe immédiate
    try {
      localStorage.setItem('lastStripeUrl', stripeUrl);
      localStorage.setItem('pendingPayment', 'true');
      window.location.href = stripeUrl;
      return true;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Fonction pour récupérer une session de paiement interrompue
 * Retourne true si une session récente existe et a été récupérée
 */
export const recoverStripeSession = (): boolean => {
  const lastUrl = localStorage.getItem('lastStripeUrl');
  const timestamp = parseInt(localStorage.getItem('stripeRedirectTimestamp') || '0', 10);
  const now = Date.now();
  
  // Vérifier si l'URL existe et n'est pas trop ancienne (moins de 30 minutes)
  if (lastUrl && now - timestamp < 30 * 60 * 1000) {
    try {
      console.log("Récupération d'une session de paiement interrompue");
      window.location.href = lastUrl;
      return true;
    } catch (e) {
      console.error("Échec de la récupération:", e);
    }
  }
  
  return false;
};
