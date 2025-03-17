
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlanSummary from '@/components/payment/PlanSummary';
import StripeCheckoutForm from '@/components/payment/StripeCheckoutForm';
import ManualPaymentForm from '@/components/payment/ManualPaymentForm';
import PaymentMethodToggle from '@/components/payment/PaymentMethodToggle';
import { PaymentFormData, PlanType } from '@/hooks/usePaymentProcessing';

interface PaymentCardProps {
  selectedPlan: PlanType | null;
  useStripeCheckout: boolean;
  isStripeProcessing: boolean;
  isProcessing: boolean;
  onToggleMethod: () => void;
  onCardFormSubmit: (cardData: PaymentFormData) => void;
  onStripeCheckout: () => void;
}

const PaymentCard = ({
  selectedPlan,
  useStripeCheckout,
  isStripeProcessing,
  isProcessing,
  onToggleMethod,
  onCardFormSubmit,
  onStripeCheckout
}: PaymentCardProps) => {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="text-xl text-[#1e3a5f]">
          Finaliser votre abonnement {selectedPlan && (selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1))}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PlanSummary selectedPlan={selectedPlan} />
        
        {useStripeCheckout ? (
          <StripeCheckoutForm 
            selectedPlan={selectedPlan}
            isStripeProcessing={isStripeProcessing}
            onCheckout={onStripeCheckout}
          />
        ) : (
          <ManualPaymentForm 
            isProcessing={isProcessing}
            onSubmit={onCardFormSubmit}
          />
        )}
      </CardContent>
      <CardFooter className="flex flex-col">
        <PaymentMethodToggle 
          useStripeCheckout={useStripeCheckout}
          onToggle={onToggleMethod}
        />
      </CardFooter>
    </Card>
  );
};

export default PaymentCard;
