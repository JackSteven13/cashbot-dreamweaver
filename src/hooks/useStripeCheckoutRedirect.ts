
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { openStripeWindow } from './payment/stripeWindowManager';
import { toast } from "@/components/ui/use-toast";

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
