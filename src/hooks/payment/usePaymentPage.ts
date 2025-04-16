
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

export const usePaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: isAuthChecking } = useAuth();
  
  // État pour suivre les récupérations de session
  const [isRecovering, setIsRecovering] = useState(false);
  const [showMobileHelper, setShowMobileHelper] = useState(false);
  
  // Plan sélectionné depuis l'URL ou la session
  const planFromUrl = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useSessionStorage<PlanType>('selectedPlan', getPlanById(planFromUrl));
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  
  // Utiliser le hook Stripe checkout avec gestion des sessions interrompues
  const { 
    isStripeProcessing, 
    handleStripeCheckout,
    stripeCheckoutUrl,
    actualSubscription,
    isChecking,
    retryCount
  } = useStripeCheckout(selectedPlan);
  
  // Vérifier s'il y a une session de paiement interrompue
  useEffect(() => {
    const checkPendingPayment = async () => {
      // Ne pas récupérer si déjà en cours de récupération ou si une nouvelle session est en train de se créer
      if (isRecovering || isStripeProcessing || stripeCheckoutUrl) {
        return;
      }
      
      // Vérifier si un paiement est en cours selon localStorage
      if (hasPendingStripePayment()) {
        console.log("Paiement en cours détecté, tentative de récupération");
        setIsRecovering(true);
        
        try {
          // Tenter de récupérer la session
          const recovered = recoverStripeSession();
          
          if (!recovered) {
            // Si la récupération automatique échoue, afficher l'assistant
            setShowMobileHelper(true);
            toast({
              title: "Reprise du paiement",
              description: "Vous pouvez reprendre votre paiement avec les options ci-dessous",
              duration: 5000,
            });
          }
        } finally {
          setIsRecovering(false);
        }
      }
    };
    
    // Tenter de récupérer une session après un court délai
    const timer = setTimeout(checkPendingPayment, 500);
    return () => clearTimeout(timer);
  }, [isStripeProcessing, stripeCheckoutUrl, isRecovering]);
  
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
    
    // Sauvegarder l'état du paiement
    localStorage.setItem('pendingPayment', 'true');
    localStorage.setItem('lastStripeUrl', ''); // Sera rempli quand l'URL sera disponible
    localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
    
    // Déclencher le processus de paiement
    handleStripeCheckout();
  };
  
  // Mettre à jour l'URL Stripe dans le stockage local dès qu'elle est disponible
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
