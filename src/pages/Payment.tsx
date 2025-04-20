
import React, { useState, useEffect } from 'react';
import { usePaymentPage } from '@/hooks/payment/usePaymentPage';
import PaymentLoading from '@/components/payment/PaymentLoading';
import PaymentLayout from '@/components/payment/PaymentLayout';
import PaymentCard from '@/components/payment/PaymentCard';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { PLANS } from '@/utils/plans';
import { hasPendingStripePayment, openStripeCheckout } from '@/utils/stripe-helper';
import PaymentSteps from '@/components/payment/PaymentSteps';
import { useAuth } from '@/hooks/useAuth';
import CheckoutTransition from '@/components/payment/CheckoutTransition';
// import MobilePaymentHelper from '@/components/payment/MobilePaymentHelper'; // removed

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

  // Ouvrir automatiquement Stripe si l'URL est disponible et animation terminée
  useEffect(() => {
    if (stripeCheckoutUrl && !isStripeProcessing && !showTransition) {
      console.log("URL Stripe disponible, préparation de la transition");
      setShowTransition(true);
    }
  }, [stripeCheckoutUrl, isStripeProcessing]);
  
  // Gérer le paiement avec transition
  const handlePayment = () => {
    if (stripeCheckoutUrl) {
      // Afficher l'animation de transition
      setShowTransition(true);
    } else {
      // Sinon, initialiser le processus Stripe
      toast({
        title: "Préparation du paiement",
        description: "Veuillez patienter pendant que nous préparons votre session de paiement...",
        duration: 3000
      });
      initiateStripeCheckout();
    }
  };

  // Gérer l'aide pour les problèmes de paiement
  const handleHelp = () => {
    setShowMobileHelper(false);
    if (stripeCheckoutUrl) {
      toast({
        title: "Redirection en cours",
        description: "Vous allez être redirigé vers la page de paiement..."
      });
      openStripeCheckout(stripeCheckoutUrl);
    }
  };
  
  // Gérer la fin de l'animation de transition
  const handleTransitionComplete = () => {
    if (stripeCheckoutUrl) {
      // Un petit délai pour que l'utilisateur voie la fin de l'animation
      setTimeout(() => {
        openStripeCheckout(stripeCheckoutUrl);
      }, 400);
    }
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
        
        {/* Animation de transition avant le paiement */}
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
