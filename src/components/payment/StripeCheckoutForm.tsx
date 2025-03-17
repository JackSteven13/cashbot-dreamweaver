
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlanType } from '@/hooks/payment/types';
import { toast } from "@/components/ui/use-toast";

interface StripeCheckoutFormProps {
  selectedPlan: PlanType | null;
  isStripeProcessing: boolean;
  onCheckout: () => void;
}

const StripeCheckoutForm = ({ 
  selectedPlan, 
  isStripeProcessing, 
  onCheckout 
}: StripeCheckoutFormProps) => {
  
  const handleCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      console.log("Initiating Stripe checkout from button click");
      onCheckout();
    } catch (error) {
      console.error("Error initiating checkout:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'initier le paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-center">
        <p className="text-[#1e3a5f] mb-2">Vous allez être redirigé vers Stripe pour un paiement sécurisé</p>
        <p className="text-sm text-[#486581]">Votre abonnement sera activé immédiatement après le paiement</p>
      </div>
      
      <Button 
        className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white w-full py-2 px-4"
        onClick={handleCheckout}
        disabled={isStripeProcessing}
        type="button"
      >
        {isStripeProcessing ? 'Traitement en cours...' : 'Payer avec Stripe'}
      </Button>
      
      {/* Bouton de secours pour ouvrir la page manuellement si besoin */}
      {isStripeProcessing && (
        <p className="text-xs text-center text-gray-500 mt-2">
          Si la page de paiement ne s'ouvre pas automatiquement, veuillez cliquer à nouveau sur le bouton.
        </p>
      )}
    </div>
  );
};

export default StripeCheckoutForm;
