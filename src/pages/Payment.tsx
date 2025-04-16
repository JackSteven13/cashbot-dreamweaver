
import React, { useState, useEffect } from 'react';
import { usePaymentPage } from '@/hooks/payment/usePaymentPage';
import PaymentLoading from '@/components/payment/PaymentLoading';
import PaymentLayout from '@/components/payment/PaymentLayout';
import PaymentCard from '@/components/payment/PaymentCard';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { PLANS } from '@/utils/plans';
import { hasPendingStripePayment } from '@/utils/stripe-helper';
import CheckoutTransition from '@/components/payment/CheckoutTransition';
import PaymentSteps from '@/components/payment/PaymentSteps';

const Payment = () => {
  const navigate = useNavigate();
  const {
    selectedPlan,
    currentSubscription,
    isAuthChecking,
    isStripeProcessing,
    stripeCheckoutUrl,
    initiateStripeCheckout,
    showMobileHelper
  } = usePaymentPage();

  const [showTransition, setShowTransition] = useState(false);
  const [transitionComplete, setTransitionComplete] = useState(false);

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
      
      // Vérifier si le plan existe
      if (selectedPlan && !PLANS[selectedPlan]) {
        toast({
          title: "Forfait invalide",
          description: "Le forfait sélectionné est invalide. Veuillez en choisir un autre.",
          variant: "destructive"
        });
        navigate('/offres');
      }
    }
  }, [selectedPlan, isAuthChecking, navigate]);
  
  // Vérifier si l'utilisateur est déjà abonné au plan sélectionné
  useEffect(() => {
    if (!isAuthChecking && selectedPlan && currentSubscription === selectedPlan) {
      toast({
        title: "Vous êtes déjà abonné",
        description: `Vous êtes déjà abonné au forfait ${selectedPlan}. Vous allez être redirigé vers votre tableau de bord.`,
      });
      
      const timeout = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedPlan, currentSubscription, isAuthChecking, navigate]);
  
  // Vérifier si un paiement a été interrompu
  useEffect(() => {
    const isPending = hasPendingStripePayment();
    if (isPending && !isStripeProcessing && !stripeCheckoutUrl) {
      toast({
        title: "Paiement en attente",
        description: "Un paiement était en cours. Vous pouvez poursuivre ou recommencer.",
        duration: 5000
      });
    }
  }, [isStripeProcessing, stripeCheckoutUrl]);

  // Gérer l'animation de transition avant l'ouverture de Stripe
  useEffect(() => {
    if (stripeCheckoutUrl && !transitionComplete) {
      setShowTransition(true);
    }
  }, [stripeCheckoutUrl, transitionComplete]);

  // Ouvrir la fenêtre Stripe après la fin de l'animation
  const handleTransitionComplete = () => {
    setTransitionComplete(true);
    
    // Redirection vers Stripe avec un léger délai pour permettre à l'animation de se terminer
    if (stripeCheckoutUrl) {
      const stripe = window.open(stripeCheckoutUrl, '_self');
      if (!stripe) {
        // Fallback
        setTimeout(() => {
          window.location.href = stripeCheckoutUrl;
        }, 300);
      }
    }
  };

  if (isAuthChecking) {
    return <PaymentLoading />;
  }

  return (
    <PaymentLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <PaymentSteps 
          currentStep="checkout" 
          selectedPlan={selectedPlan} 
        />
      
        <PaymentCard 
          selectedPlan={selectedPlan}
          currentSubscription={currentSubscription}
          isStripeProcessing={isStripeProcessing}
          onStripeCheckout={initiateStripeCheckout}
          stripeCheckoutUrl={stripeCheckoutUrl}
          showHelper={showMobileHelper}
          showAnimation={true}
        />
      </div>
      
      {/* Animation de transition */}
      <CheckoutTransition 
        isStarted={showTransition} 
        stripeUrl={stripeCheckoutUrl} 
        onComplete={handleTransitionComplete} 
      />
    </PaymentLayout>
  );
};

export default Payment;
