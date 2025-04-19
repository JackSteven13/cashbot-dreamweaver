
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { openStripeCheckout } from '@/utils/stripe-helper';

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
      
      // Rediriger directement vers Stripe
      toast({
        title: "Redirection vers Stripe",
        description: "Vous êtes redirigé vers la page de paiement...",
        duration: 3000
      });
      
      setTimeout(() => {
        openStripeCheckout(stripeCheckoutUrl);
      }, 500);
    }
  }, [navigate]);
  
  // Fonction pour configurer une redirection vers Stripe
  const setupStripeRedirect = (stripeUrl: string) => {
    if (!stripeUrl) return false;
    
    console.log("Configuration de la redirection vers Stripe:", stripeUrl);
    
    // Sauvegarder l'URL et marquer la redirection comme en attente
    localStorage.setItem('stripeCheckoutUrl', stripeUrl);
    localStorage.setItem('stripeRedirectPending', 'true');
    
    // Rediriger directement vers Stripe
    return openStripeCheckout(stripeUrl);
  };
  
  return {
    setupStripeRedirect
  };
};

