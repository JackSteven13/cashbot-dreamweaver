
/**
 * Utilitaires optimisés pour l'intégration avec Stripe et la gestion mobile
 */

/**
 * Détecte si l'appareil est un mobile pour adapter l'expérience
 */
export const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
};

/**
 * S'assure que l'URL Stripe est valide et complète
 */
export const fixStripeUrl = (url: string): string => {
  if (!url) return url;
  
  // S'assurer que l'URL commence par https://
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }
  
  return url;
};

/**
 * Nettoie les paramètres de l'URL pour éviter les problèmes avec certains navigateurs
 */
export const cleanStripeUrl = (url: string): string => {
  if (!url) return url;
  
  // Supprimer les paramètres problématiques qui peuvent causer des redirections en boucle
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('succeeded');
    urlObj.searchParams.delete('canceled');
    return urlObj.toString();
  } catch (e) {
    return url;
  }
};

/**
 * Vérifie si un paiement est en cours et doit être repris
 */
export const hasPendingStripePayment = (): boolean => {
  const isPending = localStorage.getItem('pendingPayment') === 'true';
  const url = localStorage.getItem('lastStripeUrl');
  const timestamp = parseInt(localStorage.getItem('stripeRedirectTimestamp') || '0');
  
  // Vérifier si le paiement est en cours et que l'URL n'est pas trop ancienne (20 min max)
  return isPending && !!url && (Date.now() - timestamp < 20 * 60 * 1000);
};

/**
 * Force l'URL de succès à être absolue
 */
export const getAbsoluteSuccessUrl = (): string => {
  return `${window.location.origin}/payment-success`;
};

/**
 * Force l'URL d'annulation à être absolue
 */
export const getAbsoluteCancelUrl = (): string => {
  return `${window.location.origin}/offres`;
};

/**
 * Ouvre Stripe en fonction du type d'appareil
 * Méthode améliorée avec ouverture optimisée des nouveaux onglets
 */
export const openStripeCheckout = (url: string): boolean => {
  if (!url) return false;

  try {
    // Nettoyer et valider l'URL
    const cleanUrl = fixStripeUrl(cleanStripeUrl(url));
    
    // Stocker l'URL pour récupération ultérieure en cas d'échec
    localStorage.setItem('lastStripeUrl', cleanUrl);
    localStorage.setItem('pendingPayment', 'true');
    localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
    
    // Jouer un son de caisse enregistreuse pour indiquer que le processus est lancé
    try {
      const audio = new Audio('/sounds/cash-register.mp3');
      audio.volume = 0.2; // Volume bas pour ne pas surprendre
      audio.play().catch(e => console.log('Son non joué:', e));
    } catch (e) {
      // Ignorer les erreurs de son - non critique
    }
    
    console.log("Redirection vers Stripe:", cleanUrl);

    // Sur mobile, utiliser une approche différente pour maximiser la compatibilité
    if (isMobileDevice()) {
      // Sur mobile, essayer d'ouvrir dans un nouvel onglet puis rediriger si bloqué
      try {
        // Créer dynamiquement un lien et simuler un clic pour forcer l'ouverture dans un nouvel onglet
        const link = document.createElement('a');
        link.href = cleanUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Vérifier après un court délai si la navigation a été bloquée
        setTimeout(() => {
          // Si l'utilisateur est toujours sur la même page après 300ms, c'est que l'ouverture
          // dans un nouvel onglet a probablement été bloquée, rediriger directement
          window.location.href = cleanUrl;
        }, 300);
      } catch (e) {
        console.error("Erreur lors de l'ouverture sur mobile:", e);
        window.location.href = cleanUrl;
      }
    } else {
      // Sur desktop, ouvrir dans une nouvelle fenêtre avec _blank
      const newWindow = window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      
      // Si l'ouverture est bloquée, tenter une redirection directe
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.warn("Ouverture bloquée, tentative de redirection directe");
        window.location.href = cleanUrl;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de Stripe:", error);
    
    // Dernière tentative: redirection directe
    window.location.href = url;
    return false;
  }
};
