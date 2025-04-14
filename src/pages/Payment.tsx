
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

  // Vérifier si un plan est sélectionné et valide
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
      
      // Vérifier si le plan sélectionné existe dans la liste des plans
      if (selectedPlan && !PLANS[selectedPlan]) {
        toast({
          title: "Forfait invalide",
          description: "Le forfait sélectionné est invalide. Veuillez en choisir un autre.",
          variant: "destructive"
        });
        navigate('/offres');
        return;
      }
      
      // Afficher le prix du plan sélectionné
      if (selectedPlan && PLANS[selectedPlan]) {
        console.log(`Plan sélectionné: ${selectedPlan}, Prix: ${PLANS[selectedPlan].price}€`);
      }
    }
  }, [selectedPlan, isAuthChecking, navigate]);
  
  // Vérifier si l'utilisateur est déjà abonné au plan sélectionné
  useEffect(() => {
    if (!isAuthChecking && selectedPlan && currentSubscription === selectedPlan) {
      toast({
        title: "Vous êtes déjà abonné",
        description: `Vous êtes déjà abonné au forfait ${selectedPlan}. Vous allez être redirigé vers votre tableau de bord.`,
        variant: "default"
      });
      
      // Rediriger vers le dashboard après un court délai
      const timeout = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedPlan, currentSubscription, isAuthChecking, navigate]);
  
  // Déclencher automatiquement le paiement Stripe après le chargement du plan
  useEffect(() => {
    if (selectedPlan && !isAuthChecking && useStripePayment && !stripeCheckoutUrl && !isStripeProcessing) {
      console.log("Déclenchement automatique du paiement Stripe");
      // Léger délai pour s'assurer que tous les composants sont montés
      const timeout = setTimeout(() => {
        initiateStripeCheckout();
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedPlan, isAuthChecking, useStripePayment, stripeCheckoutUrl, isStripeProcessing, initiateStripeCheckout]);

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
