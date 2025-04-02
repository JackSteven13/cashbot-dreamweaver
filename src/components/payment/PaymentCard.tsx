
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlanSummary from '@/components/payment/PlanSummary';
import StripeCheckoutForm from '@/components/payment/StripeCheckoutForm';
import ManualPaymentForm from '@/components/payment/ManualPaymentForm';
import { PaymentFormData, PlanType } from '@/hooks/payment/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface PaymentCardProps {
  selectedPlan: PlanType | null;
  useStripeCheckout: boolean;
  isStripeProcessing: boolean;
  isProcessing: boolean;
  onToggleMethod: () => void;
  onCardFormSubmit: (cardData: PaymentFormData) => void;
  onStripeCheckout: () => void;
  stripeCheckoutUrl?: string | null;
}

const PaymentCard = ({
  selectedPlan,
  useStripeCheckout,
  isStripeProcessing,
  isProcessing,
  onToggleMethod,
  onCardFormSubmit,
  onStripeCheckout,
  stripeCheckoutUrl
}: PaymentCardProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className="cyber-card max-w-[95vw] md:max-w-full mx-auto">
      <CardHeader className="py-3 px-4 md:p-6">
        <CardTitle className="text-base md:text-xl text-[#1e3a5f]">
          Finaliser votre abonnement {selectedPlan && (selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1))}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6 pb-6">
        <PlanSummary selectedPlan={selectedPlan} />
        
        {useStripeCheckout ? (
          <StripeCheckoutForm 
            selectedPlan={selectedPlan}
            isStripeProcessing={isStripeProcessing}
            onCheckout={onStripeCheckout}
            stripeUrl={stripeCheckoutUrl}
          />
        ) : (
          <ManualPaymentForm 
            isProcessing={isProcessing}
            onSubmit={onCardFormSubmit}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;
