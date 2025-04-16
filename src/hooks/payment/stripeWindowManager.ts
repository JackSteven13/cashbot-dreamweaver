
/**
 * Gestionnaire amélioré de fenêtre Stripe spécifiquement optimisé pour les mobiles
 */

import { toast } from '@/components/ui/use-toast';
import { fixStripeUrl, isMobileDevice } from '@/utils/stripe-helper';

/**
 * Ouvre l'URL de paiement Stripe avec une gestion avancée pour les appareils mobiles
 * Utilise différentes stratégies pour maximiser la compatibilité
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  if (!stripeUrl) {
    console.error("URL Stripe manquante");
    return false;
  }
  
  try {
    const isMobile = isMobileDevice();
    
    console.log(`Tentative d'ouverture de Stripe (${isMobile ? 'mobile' : 'desktop'}):`, stripeUrl);
    
    // Garantir que l'URL est valide et complète
    const finalUrl = fixStripeUrl(stripeUrl);
    
    // STRATÉGIE MOBILE: Redirection directe sans délai
    if (isMobile) {
      console.log("Appareil mobile détecté, redirection directe immédiate");
      
      // Sauvegarder les données de session pour récupération
      localStorage.setItem('lastStripeUrl', finalUrl);
      localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
      localStorage.setItem('pendingPayment', 'true');
      
      // Redirection maximale priorité
      setTimeout(() => { 
        // Timeout minimal pour permettre à l'interface de se mettre à jour
        window.location.replace(finalUrl);
      }, 50);
      
      return true;
    }
    
    // STRATÉGIE DESKTOP: Tenter une nouvelle fenêtre d'abord
    const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer');
    
    if (newWindow && !newWindow.closed) {
      newWindow.focus();
      console.log("Nouvelle fenêtre Stripe ouverte avec succès");
      
      // Sauvegarder pour récupération potentielle
      localStorage.setItem('lastStripeUrl', finalUrl);
      localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
      localStorage.setItem('pendingPayment', 'true');
      
      return true;
    } else {
      console.log("Échec de l'ouverture de la fenêtre, tentative de redirection directe");
      
      // Sauvegarder pour récupération
      localStorage.setItem('lastStripeUrl', finalUrl);
      localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
      localStorage.setItem('pendingPayment', 'true');
      
      // Redirection directe en dernier recours
      window.location.href = finalUrl;
      return true;
    }
  } catch (error) {
    console.error("Erreur lors de l'ouverture de Stripe:", error);
    
    // Dernière tentative de redirection directe
    try {
      window.location.href = stripeUrl;
      return true;
    } catch (e) {
      toast({
        title: "Erreur de paiement",
        description: "Impossible d'ouvrir la page de paiement. Veuillez réessayer.",
        variant: "destructive"
      });
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
  const MAX_AGE = 30 * 60 * 1000; // 30 minutes
  
  // Vérifier si l'URL existe et n'est pas trop ancienne
  if (lastUrl && (now - timestamp) < MAX_AGE) {
    try {
      console.log("Récupération d'une session de paiement interrompue");
      
      // Rediriger immédiatement vers l'URL sauvegardée
      window.location.replace(lastUrl);
      return true;
    } catch (e) {
      console.error("Échec de la récupération:", e);
    }
  } else if (lastUrl) {
    // Session expirée, nettoyer
    localStorage.removeItem('lastStripeUrl');
    localStorage.removeItem('stripeRedirectTimestamp');
    localStorage.removeItem('pendingPayment');
  }
  
  return false;
};
