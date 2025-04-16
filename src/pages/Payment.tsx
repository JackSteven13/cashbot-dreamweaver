
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
import StripeConfirmationModal from '@/components/payment/StripeConfirmationModal';

const Payment = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [showTransition, setShowTransition] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  
  const {
    selectedPlan,
    currentSubscription,
    isAuthChecking,
    isStripeProcessing,
    stripeCheckoutUrl,
    initiateStripeCheckout
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
  
  // Gérer le paiement - l'utilisateur doit cliquer sur un bouton pour initialiser le processus
  const handlePayment = () => {
    // Au lieu d'activer la transition immédiatement, afficher d'abord la modal de confirmation
    setShowConfirmationModal(true);
  };
  
  // Cette fonction est appelée quand l'utilisateur confirme dans la modal
  const handleConfirmPayment = () => {
    setShowConfirmationModal(false);
    setShowTransition(true); // Activer la transition
    initiateStripeCheckout(); // Déclencher le paiement
  };
  
  // Lorsque la transition est terminée, rien à faire car CheckoutTransition se charge d'ouvrir Stripe
  const handleTransitionComplete = () => {
    console.log("Transition terminée, la redirection vers Stripe devrait suivre automatiquement");
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
        
        {/* Modal de confirmation avant de procéder au paiement */}
        <StripeConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={handleConfirmPayment}
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
