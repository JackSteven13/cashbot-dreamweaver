
import React from 'react';
import { usePaymentPage } from '@/hooks/payment/usePaymentPage';
import PaymentLoading from '@/components/payment/PaymentLoading';
import PaymentLayout from '@/components/payment/PaymentLayout';
import PaymentCard from '@/components/payment/PaymentCard';

const Payment = () => {
  const {
    selectedPlan,
    currentSubscription,
    isAuthChecking,
    useStripePayment,
    isProcessing,
    isStripeProcessing,
    stripeCheckoutUrl,
    togglePaymentMethod,
    handleCardFormSubmit,
    initiateStripeCheckout
  } = usePaymentPage();

  if (isAuthChecking) {
    return <PaymentLoading />;
  }

  return (
    <PaymentLayout>
      <PaymentCard 
        selectedPlan={selectedPlan}
        currentSubscription={currentSubscription}
        useStripeCheckout={useStripePayment}
        isStripeProcessing={isStripeProcessing}
        isProcessing={isProcessing}
        onToggleMethod={togglePaymentMethod}
        onCardFormSubmit={handleCardFormSubmit}
        onStripeCheckout={initiateStripeCheckout}
        stripeCheckoutUrl={stripeCheckoutUrl}
      />
    </PaymentLayout>
  );
};

export default Payment;
