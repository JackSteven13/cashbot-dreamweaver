
/**
 * Gestionnaire de fenêtre Stripe optimisé pour les mobiles et navigateurs modernes
 */

import { isMobileDevice } from "@/utils/stripe-helper";

/**
 * Ouvre l'URL de paiement Stripe dans une nouvelle fenêtre/onglet
 * avec gestion améliorée pour les appareils mobiles
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  if (!stripeUrl) {
    console.error("URL Stripe manquante");
    return false;
  }
  
  try {
    const isMobile = isMobileDevice();
    console.log(`Tentative d'ouverture de Stripe (${isMobile ? 'mobile' : 'desktop'}):`, stripeUrl);
    
    if (isMobile) {
      // Sur mobile, utiliser une redirection directe pour une compatibilité maximale
      window.location.href = stripeUrl;
      return true;
    } else {
      // Sur desktop, ouvrir dans un nouvel onglet avec une meilleure gestion
      const newWindow = window.open(stripeUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.log("Ouverture de nouvel onglet bloquée, utilisation de la redirection directe");
        window.location.href = stripeUrl;
        return true;
      }
      
      newWindow.focus();
    }
    
    // Stocker l'URL dans localStorage pour récupération éventuelle
    localStorage.setItem('lastStripeUrl', stripeUrl);
    localStorage.setItem('pendingPayment', 'true');
    localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre:", error);
    
    // Dernière tentative avec redirection directe
    window.location.href = stripeUrl;
    return true;
  }
};

/**
 * Vérifie si une fenêtre Stripe est déjà ouverte
 */
export const isStripeWindowOpen = (): boolean => {
  // Cette fonction pourrait être étendue pour vérifier si un onglet Stripe spécifique est ouvert
  return localStorage.getItem('pendingPayment') === 'true';
};

/**
 * Récupère une session de paiement Stripe interrompue
 */
export const recoverStripeSession = (): boolean => {
  try {
    const stripeUrl = localStorage.getItem('lastStripeUrl');
    const isPending = localStorage.getItem('pendingPayment') === 'true';
    const timestamp = parseInt(localStorage.getItem('stripeRedirectTimestamp') || '0');
    
    // Vérifier si le paiement est en cours et pas trop ancien (moins de 20 minutes)
    if (isPending && stripeUrl && (Date.now() - timestamp < 20 * 60 * 1000)) {
      console.log("Tentative de récupération d'une session Stripe:", stripeUrl);
      return openStripeWindow(stripeUrl);
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la récupération de session:", error);
    return false;
  }
};
