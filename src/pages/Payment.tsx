
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

  // Ouvrir automatiquement Stripe si l'URL est disponible
  useEffect(() => {
    if (stripeCheckoutUrl && !isStripeProcessing) {
      console.log("URL Stripe disponible, redirection automatique");
      // Délai court pour permettre au toast de s'afficher
      const timer = setTimeout(() => {
        openStripeCheckout(stripeCheckoutUrl);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stripeCheckoutUrl, isStripeProcessing]);
  
  // Gérer le paiement - directement sans modal de confirmation
  const handlePayment = () => {
    if (stripeCheckoutUrl) {
      // Si on a déjà une URL, l'utiliser directement
      openStripeCheckout(stripeCheckoutUrl);
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
      </div>
    </PaymentLayout>
  );
};

export default Payment;

