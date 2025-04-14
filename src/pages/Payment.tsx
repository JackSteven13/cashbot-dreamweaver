
import React, { useEffect } from 'react';
import { usePaymentPage } from '@/hooks/payment/usePaymentPage';
import PaymentLoading from '@/components/payment/PaymentLoading';
import PaymentLayout from '@/components/payment/PaymentLayout';
import PaymentCard from '@/components/payment/PaymentCard';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { PLANS } from '@/utils/plans';

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

  // Check if a plan is selected and valid
  useEffect(() => {
    if (!isAuthChecking) {
      if (!selectedPlan) {
        toast({
          title: "Aucun forfait sélectionné",
          description: "Veuillez sélectionner un forfait avant de continuer.",
          variant: "destructive"
        });
        navigate('/offres');
        return;
      }
      
      // Check if selected plan exists
      if (selectedPlan && !PLANS[selectedPlan]) {
        toast({
          title: "Forfait invalide",
          description: "Le forfait sélectionné est invalide. Veuillez en choisir un autre.",
          variant: "destructive"
        });
        navigate('/offres');
        return;
      }
      
      // Display selected plan price
      if (selectedPlan && PLANS[selectedPlan]) {
        console.log(`Plan sélectionné: ${selectedPlan}, Prix: ${PLANS[selectedPlan].price}€`);
      }
    }
  }, [selectedPlan, isAuthChecking, navigate]);
  
  // Check if user is already subscribed to the selected plan
  useEffect(() => {
    if (!isAuthChecking && selectedPlan && currentSubscription === selectedPlan) {
      toast({
        title: "Vous êtes déjà abonné",
        description: `Vous êtes déjà abonné au forfait ${selectedPlan}. Vous allez être redirigé vers votre tableau de bord.`,
        variant: "default"
      });
      
      // Redirect to dashboard after a short delay
      const timeout = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedPlan, currentSubscription, isAuthChecking, navigate]);

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
