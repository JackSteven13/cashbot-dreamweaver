
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";

/**
 * Ouvre une fenêtre Stripe de manière fiable
 */
export const openStripeWindow = (url: string): boolean => {
  try {
    // Tentative d'ouverture dans un nouvel onglet
    const stripeWindow = window.open(url, '_blank');
    
    // Vérifier si la fenêtre a été ouverte avec succès
    if (stripeWindow) {
      stripeWindow.focus();
      return true;
    }
    
    // Si l'ouverture a échoué mais que nous sommes sur mobile, rediriger directement
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      console.log("Redirection mobile vers Stripe");
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

/**
 * Hook pour gérer la redirection vers Stripe Checkout
 * et résoudre les problèmes de popup bloqués
 */
export const useStripeCheckoutRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Vérifier si une URL Stripe est stockée
    const stripeCheckoutUrl = localStorage.getItem('stripeCheckoutUrl');
    const stripeRedirectPending = localStorage.getItem('stripeRedirectPending');
    
    if (stripeCheckoutUrl && stripeRedirectPending === 'true') {
      console.log("Tentative de redirection vers Stripe:", stripeCheckoutUrl);
      
      // Effacer le flag de redirection en attente
      localStorage.setItem('stripeRedirectPending', 'false');
      
      // Essayer d'ouvrir la fenêtre Stripe
      const opened = openStripeWindow(stripeCheckoutUrl);
      
      if (opened) {
        toast({
          title: "Redirection vers Stripe",
          description: "Vous êtes redirigé vers la page de paiement Stripe...",
          duration: 5000
        });
      } else {
        toast({
          title: "Erreur de redirection",
          description: "Impossible d'ouvrir la page de paiement Stripe. Veuillez réessayer.",
          variant: "destructive",
          duration: 5000
        });
      }
    }
  }, [navigate]);
  
  // Fonction pour configurer une redirection vers Stripe
  const setupStripeRedirect = (stripeUrl: string) => {
    if (!stripeUrl) return false;
    
    console.log("Configuration de la redirection vers Stripe:", stripeUrl);
    
    // Sauvegarder l'URL et marquer la redirection comme en attente
    localStorage.setItem('stripeCheckoutUrl', stripeUrl);
    localStorage.setItem('stripeRedirectPending', 'true');
    
    // Essayer d'ouvrir la fenêtre Stripe immédiatement
    return openStripeWindow(stripeUrl);
  };
  
  return {
    setupStripeRedirect
  };
};
