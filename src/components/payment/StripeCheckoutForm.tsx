
import React from 'react';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/usePaymentProcessing';

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
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-center">
        <p className="text-[#1e3a5f] mb-2">Vous allez être redirigé vers Stripe pour un paiement sécurisé</p>
        <p className="text-sm text-[#486581]">Votre abonnement sera activé immédiatement après le paiement</p>
      </div>
      
      <Button 
        fullWidth 
        className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white"
        onClick={onCheckout}
        isLoading={isStripeProcessing}
      >
        {isStripeProcessing ? 'Traitement en cours...' : 'Payer avec Stripe'}
      </Button>
    </div>
  );
};

export default StripeCheckoutForm;
