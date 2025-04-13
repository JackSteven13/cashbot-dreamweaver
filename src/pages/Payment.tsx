
import React, { useEffect } from 'react';
import { usePaymentPage } from '@/hooks/payment/usePaymentPage';
import PaymentLoading from '@/components/payment/PaymentLoading';
import PaymentLayout from '@/components/payment/PaymentLayout';
import PaymentCard from '@/components/payment/PaymentCard';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const Payment = () => {
  const navigate = useNavigate();
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

  // Vérifier si un plan est sélectionné
  useEffect(() => {
    if (!selectedPlan && !isAuthChecking) {
      toast({
        title: "Aucun forfait sélectionné",
        description: "Veuillez sélectionner un forfait avant de continuer.",
        variant: "destructive"
      });
      navigate('/offres');
    }
  }, [selectedPlan, isAuthChecking, navigate]);

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
