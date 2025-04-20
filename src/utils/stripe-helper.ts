
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
 * Méthode améliorée avec gestion optimale des redirections
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
    
    console.log("Redirection directe vers Stripe:", cleanUrl);
    
    // Forcer un petit délai pour permettre la transition
    setTimeout(() => {
      // Sur mobile, forcer l'ouverture dans le navigateur principal
      if (isMobileDevice()) {
        console.log("Redirection mobile optimisée");
        window.location.href = cleanUrl;
      } else {
        // Sur desktop, ouvrir dans une nouvelle fenêtre puis rediriger
        try {
          const stripeWindow = window.open(cleanUrl, '_blank');
          if (!stripeWindow || stripeWindow.closed || typeof stripeWindow.closed === 'undefined') {
            // Si la fenêtre est bloquée, essayer une redirection directe
            console.log("Ouverture de fenêtre bloquée, redirection directe");
            window.location.href = cleanUrl;
          }
        } catch (e) {
          console.error("Erreur d'ouverture de fenêtre:", e);
          window.location.href = cleanUrl;
        }
      }
    }, 300);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de Stripe:", error);
    // Tenter une redirection directe en dernier recours
    window.location.href = url;
    return false;
  }
};
