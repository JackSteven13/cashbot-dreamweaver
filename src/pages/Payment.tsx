
import React, { useState, useEffect } from 'react';
import { usePaymentPage } from '@/hooks/payment/usePaymentPage';
import PaymentLoading from '@/components/payment/PaymentLoading';
import PaymentLayout from '@/components/payment/PaymentLayout';
import PaymentCard from '@/components/payment/PaymentCard';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { PLANS } from '@/utils/plans';
import { hasPendingStripePayment } from '@/utils/stripe-helper';
import PaymentSteps from '@/components/payment/PaymentSteps';
import CheckoutTransition from '@/components/payment/CheckoutTransition';
import { useAuth } from '@/hooks/useAuth';
import MobilePaymentHelper from '@/components/payment/MobilePaymentHelper';

const Payment = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [showTransition, setShowTransition] = useState(false);
  
  const {
    selectedPlan,
    currentSubscription,
    isAuthChecking,
    isStripeProcessing,
    stripeCheckoutUrl,
    initiateStripeCheckout,
    showMobileHelper,
    setShowMobileHelper
  } = usePaymentPage();

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour accéder au paiement.",
        variant: "destructive"
      });
      navigate('/login?redirect=/offres');
    }
  }, [user, isAuthLoading, navigate]);

  // Vérifier si un plan est sélectionné et valide
  useEffect(() => {
    if (!isAuthChecking && !isAuthLoading) {
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
  }, [selectedPlan, isAuthChecking, isAuthLoading, navigate]);
  
  // Vérifier si l'utilisateur est déjà abonné au plan sélectionné
  useEffect(() => {
    if (!isAuthChecking && !isAuthLoading && selectedPlan && currentSubscription === selectedPlan) {
      toast({
        title: "Vous êtes déjà abonné",
        description: `Vous êtes déjà abonné au forfait ${selectedPlan}. Vous allez être redirigé vers votre tableau de bord.`,
      });
      
      const timeout = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedPlan, currentSubscription, isAuthChecking, isAuthLoading, navigate]);
  
  // Gérer le paiement - directement sans modal de confirmation
  const handlePayment = () => {
    setShowTransition(true); // Afficher la transition
    initiateStripeCheckout(); // Déclencher le paiement
  };
  
  // Lorsque la transition est terminée
  const handleTransitionComplete = () => {
    console.log("Transition terminée, attendant que l'utilisateur clique pour continuer vers Stripe");
  };

  // Gérer l'aide pour les problèmes de paiement
  const handleHelp = () => {
    setShowMobileHelper(false);
    toast({
      title: "Redirection en cours",
      description: "Vous allez être redirigé vers la page de paiement..."
    });
  };

  if (isAuthChecking || isAuthLoading) {
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
          onStripeCheckout={handlePayment} 
          stripeCheckoutUrl={stripeCheckoutUrl}
        />
        
        {/* Aide en cas de problème avec le paiement */}
        <MobilePaymentHelper 
          isVisible={showMobileHelper}
          onHelp={handleHelp}
          stripeUrl={stripeCheckoutUrl}
        />
        
        {/* Transition animée pour le paiement */}
        {showTransition && (
          <CheckoutTransition 
            isStarted={showTransition}
            stripeUrl={stripeCheckoutUrl}
            onComplete={handleTransitionComplete}
          />
        )}
      </div>
    </PaymentLayout>
  );
};

export default Payment;
