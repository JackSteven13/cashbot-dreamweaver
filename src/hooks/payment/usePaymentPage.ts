
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
  
  // Vérifier si un problème a été détecté avec le paiement
  useEffect(() => {
    const checkPaymentIssues = () => {
      // Si l'utilisateur est sur mobile et qu'un paiement a échoué ou a été interrompu
      if (isMobileDevice() && hasPendingStripePayment()) {
        const lastAttemptTime = parseInt(localStorage.getItem('stripeRedirectTimestamp') || '0');
        const timeSinceLastAttempt = Date.now() - lastAttemptTime;
        
        // Si la dernière tentative date d'il y a plus de 30 secondes mais moins de 20 minutes
        if (timeSinceLastAttempt > 30000 && timeSinceLastAttempt < 20 * 60 * 1000) {
          setShowMobileHelper(true);
        }
      }
    };
    
    // Vérifier après un court délai pour laisser la page se charger
    const timer = setTimeout(checkPaymentIssues, 2000);
    return () => clearTimeout(timer);
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
          // Afficher un toast pour informer l'utilisateur
          toast({
            title: "Paiement en cours détecté",
            description: "Votre paiement précédent n'a pas été finalisé. Souhaitez-vous reprendre?",
            duration: 5000
          });
          
          // Ne pas récupérer automatiquement, laisser l'utilisateur décider via l'aide mobile
          setShowMobileHelper(true);
        } finally {
          setIsRecovering(false);
        }
      }
    };
    
    const timer = setTimeout(checkPendingPayment, 1000);
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
