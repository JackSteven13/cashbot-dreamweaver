
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import useSessionStorage from '@/hooks/useSessionStorage';
import { PlanType } from './types';
import { toast } from '@/components/ui/use-toast';
import { useStripeCheckout } from './useStripeCheckout';
import { getPlanById } from '@/utils/plans';

export const usePaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: isAuthChecking } = useAuth();
  
  // Plan sélectionné depuis l'URL ou la session
  const planFromUrl = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useSessionStorage<PlanType>('selectedPlan', getPlanById(planFromUrl));
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  
  // Utiliser le hook Stripe checkout
  const { 
    isStripeProcessing, 
    handleStripeCheckout,
    stripeCheckoutUrl,
    actualSubscription,
    isChecking
  } = useStripeCheckout(selectedPlan);
  
  // Vérifier le plan sélectionné depuis l'URL au chargement initial
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      const validPlan = getPlanById(planParam);
      if (validPlan) {
        setSelectedPlan(validPlan);
        console.log("Plan sélectionné depuis l'URL:", validPlan);
      }
    }
  }, [searchParams, setSelectedPlan]);
  
  // Récupérer l'abonnement actuel de l'utilisateur
  useEffect(() => {
    if (actualSubscription) {
      setCurrentSubscription(actualSubscription);
    }
  }, [actualSubscription]);
  
  // Gérer le checkout Stripe
  const initiateStripeCheckout = () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan pour continuer",
        variant: "destructive"
      });
      return;
    }
    
    // Déclencher le processus de paiement
    handleStripeCheckout();
  };
  
  return {
    selectedPlan,
    currentSubscription,
    isAuthChecking,
    isStripeProcessing,
    stripeCheckoutUrl,
    initiateStripeCheckout
  };
};

export default usePaymentPage;
