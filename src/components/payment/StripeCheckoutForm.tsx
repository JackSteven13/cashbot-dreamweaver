
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, ExternalLink } from 'lucide-react';
import { PlanType } from '@/hooks/payment/types';

interface StripeCheckoutFormProps {
  selectedPlan: PlanType | null;
  isStripeProcessing: boolean;
  onCheckout: () => void;
  stripeUrl?: string;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  selectedPlan,
  isStripeProcessing,
  onCheckout,
  stripeUrl
}) => {
  const handleManualRedirect = () => {
    if (stripeUrl) {
      console.log("Redirection manuelle vers:", stripeUrl);
      window.open(stripeUrl, '_blank') || window.location.href = stripeUrl;
    } else {
      console.log("Aucune URL Stripe disponible pour la redirection manuelle");
      onCheckout(); // Essayer à nouveau via le flux normal
    }
  };
  
  // Obtenir le texte et le style appropriés du bouton en fonction du plan
  const buttonText = (() => {
    if (isStripeProcessing) return "Redirection en cours...";
    
    switch (selectedPlan) {
      case "pro":
        return "Payer avec Stripe - Offre Pro";
      case "visionnaire":
        return "Payer avec Stripe - Offre Visionnaire";
      case "alpha":
        return "Payer avec Stripe - Offre Alpha";
      default:
        return "Payer avec Stripe";
    }
  })();
  
  // Classes de couleur du bouton en fonction du plan
  const buttonClasses = (() => {
    const baseClasses = "w-full p-3 font-medium rounded-md flex items-center justify-center gap-2 mt-4 transition-all";
    
    if (!selectedPlan || selectedPlan === "freemium") {
      return `${baseClasses} bg-gray-500 text-white`;
    }
    
    switch (selectedPlan) {
      case "pro":
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`;
      case "visionnaire":
        return `${baseClasses} bg-purple-600 hover:bg-purple-700 text-white`;
      case "alpha":
        return `${baseClasses} bg-indigo-600 hover:bg-indigo-700 text-white`;
      default:
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`;
    }
  })();
  
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <ShoppingCart className="h-4 w-4" />
          <span>Paiement 100% sécurisé par Stripe</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <CreditCard className="h-4 w-4" />
          <span>Accepte toutes les cartes bancaires et Apple Pay</span>
        </div>
      </div>
      
      <Button
        type="button"
        className={buttonClasses}
        onClick={onCheckout}
        disabled={isStripeProcessing || !selectedPlan || selectedPlan === "freemium"}
      >
        {isStripeProcessing ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {buttonText}
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>
      
      {isStripeProcessing && (
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2 text-sm flex items-center justify-center gap-2"
          onClick={handleManualRedirect}
        >
          <ExternalLink className="h-4 w-4" />
          Problème d'ouverture? Cliquez ici
        </Button>
      )}
    </div>
  );
};

export default StripeCheckoutForm;
