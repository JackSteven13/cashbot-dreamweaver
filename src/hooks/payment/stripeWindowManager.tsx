
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
    // Stocker l'URL pour récupération éventuelle
    localStorage.setItem('lastStripeUrl', stripeUrl);
    localStorage.setItem('pendingPayment', 'true');
    localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
    
    console.log("Redirection vers Stripe:", stripeUrl);
    
    // Redirection directe vers Stripe - méthode la plus fiable
    window.location.href = stripeUrl;
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la redirection vers Stripe:", error);
    
    // Dernière tentative avec redirection directe
    window.location.href = stripeUrl;
    
    return false;
  }
};

/**
 * Vérifie si une fenêtre Stripe est déjà ouverte
 */
export const isStripeWindowOpen = (): boolean => {
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
      
      // Ajouter un délai pour que l'utilisateur puisse comprendre ce qui se passe
      toast({
        title: "Reprise du paiement",
        description: "Nous vous redirigeons vers la page de paiement précédente...",
        duration: 3000
      });
      
      setTimeout(() => {
        return openStripeWindow(stripeUrl);
      }, 2000);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la récupération de session:", error);
    return false;
  }
};

