
import React from 'react';
import Button from '@/components/Button';

interface PaymentMethodToggleProps {
  useStripeCheckout: boolean;
  onToggle: () => void;
}

const PaymentMethodToggle = ({ useStripeCheckout, onToggle }: PaymentMethodToggleProps) => {
  return (
    <div className="w-full flex justify-center">
      <Button 
        variant="outline" 
        className="text-[#2d5f8a] border-[#2d5f8a]"
        onClick={onToggle}
      >
        {useStripeCheckout ? 'Utiliser le formulaire classique' : 'Payer avec Stripe'}
      </Button>
    </div>
  );
};

export default PaymentMethodToggle;
