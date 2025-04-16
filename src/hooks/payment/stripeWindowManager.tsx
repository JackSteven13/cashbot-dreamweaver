
/**
 * Gestionnaire de fenêtre Stripe optimisé pour les mobiles et navigateurs modernes
 */

import { isMobileDevice } from "@/utils/stripe-helper";
import { toast } from "@/components/ui/use-toast";

/**
 * Ouvre l'URL de paiement Stripe dans une nouvelle fenêtre/onglet
 * avec gestion améliorée pour les appareils mobiles
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  if (!stripeUrl) {
    console.error("URL Stripe manquante");
    toast({
      title: "Erreur",
      description: "L'URL de paiement est manquante. Veuillez réessayer.",
      variant: "destructive",
    });
    return false;
  }
  
  try {
    const isMobile = isMobileDevice();
    console.log(`Ouverture de Stripe (${isMobile ? 'mobile' : 'desktop'}):`, stripeUrl);
    
    // Stocker l'URL dans localStorage pour récupération éventuelle
    localStorage.setItem('lastStripeUrl', stripeUrl);
    localStorage.setItem('pendingPayment', 'true');
    localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
    
    // Sur mobile, utiliser une redirection directe
    if (isMobile) {
      // S'assurer que l'URL est complète et valide
      if (!stripeUrl.startsWith('http')) {
        stripeUrl = `https://${stripeUrl}`;
      }
      
      // Redirection douce avec un délai pour permettre à l'animation de se terminer
      setTimeout(() => {
        window.location.href = stripeUrl;
      }, 300);
      
      return true;
    } 
    // Sur desktop, ouvrir dans un nouvel onglet avec une meilleure gestion
    else {
      try {
        // Tentative d'ouverture dans un nouvel onglet
        const stripeWindow = window.open(stripeUrl, '_blank');
        
        // Vérifier si la fenêtre a été ouverte avec succès
        if (!stripeWindow || stripeWindow.closed || typeof stripeWindow.closed === 'undefined') {
          console.log("Échec de l'ouverture dans un nouvel onglet, redirection directe");
          
          // Si l'ouverture a échoué, rediriger directement
          setTimeout(() => {
            window.location.href = stripeUrl;
          }, 300);
        } else {
          // Si l'ouverture a réussi, donner le focus à la fenêtre
          stripeWindow.focus();
        }
        
        return true;
      } catch (err) {
        console.error("Erreur lors de l'ouverture dans un nouvel onglet:", err);
        
        // Si une erreur se produit, rediriger directement
        window.location.href = stripeUrl;
        return true;
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre Stripe:", error);
    
    // Tentative de redirection directe en dernier recours
    window.location.href = stripeUrl;
    return false;
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
