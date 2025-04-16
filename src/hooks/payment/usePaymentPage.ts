
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import useSessionStorage from '@/hooks/useSessionStorage';
import { PlanType } from './types';
import { toast } from '@/components/ui/use-toast';
import { useStripeCheckout } from './useStripeCheckout';
import { getPlanById } from '@/utils/plans';
import { recoverStripeSession } from './stripeWindowManager';
import { hasPendingStripePayment } from '@/utils/stripe-helper';
import { isMobileDevice } from '@/utils/stripe-helper';

export const usePaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: isAuthChecking } = useAuth();
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [showMobileHelper, setShowMobileHelper] = useState(false);
  
  const planFromUrl = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useSessionStorage<PlanType>('selectedPlan', getPlanById(planFromUrl));
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  
  const { 
    isStripeProcessing, 
    handleStripeCheckout,
    stripeCheckoutUrl,
    actualSubscription,
    isChecking,
    retryCount
  } = useStripeCheckout(selectedPlan);
  
  // Vérifier si un appareil mobile est détecté
  useEffect(() => {
    if (isMobileDevice()) {
      setShowMobileHelper(true);
    }
  }, []);
  
  // Vérifier s'il y a un paiement en cours à reprendre
  useEffect(() => {
    const checkPendingPayment = async () => {
      if (isRecovering || isStripeProcessing || stripeCheckoutUrl) {
        return;
      }
      
      if (hasPendingStripePayment()) {
        console.log("Paiement en cours détecté, tentative de récupération");
        setIsRecovering(true);
        
        try {
          recoverStripeSession();
        } finally {
          setIsRecovering(false);
        }
      }
    };
    
    const timer = setTimeout(checkPendingPayment, 500);
    return () => clearTimeout(timer);
  }, [isStripeProcessing, stripeCheckoutUrl, isRecovering]);
  
  // Mise à jour du plan sélectionné depuis l'URL
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
  
  // Mise à jour de l'abonnement actuel
  useEffect(() => {
    if (actualSubscription) {
      setCurrentSubscription(actualSubscription);
    }
  }, [actualSubscription]);
  
  // Fonction pour initialiser le paiement Stripe
  const initiateStripeCheckout = () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan pour continuer",
        variant: "destructive"
      });
      return;
    }
    
    // Préparer le localStorage pour la récupération ultérieure si nécessaire
    localStorage.setItem('pendingPayment', 'true');
    localStorage.setItem('lastStripeUrl', '');
    localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
    
    // Démarrer le processus de création de session Stripe
    handleStripeCheckout();
  };
  
  // Stocker l'URL de checkout pour récupération ultérieure
  useEffect(() => {
    if (stripeCheckoutUrl) {
      localStorage.setItem('lastStripeUrl', stripeCheckoutUrl);
    }
  }, [stripeCheckoutUrl]);
  
  return {
    selectedPlan,
    currentSubscription,
    isAuthChecking,
    isStripeProcessing,
    stripeCheckoutUrl,
    initiateStripeCheckout,
    isRecovering,
    showMobileHelper,
    setShowMobileHelper,
    retryCount
  };
};

export default usePaymentPage;
