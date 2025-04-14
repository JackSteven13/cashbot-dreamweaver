
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import useSessionStorage from '@/hooks/useSessionStorage';
import { PaymentFormData, PlanType } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useStripeCheckout } from './useStripeCheckout';
import { getPlanById } from '@/utils/plans';

export const usePaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: isAuthChecking } = useAuth();
  
  // Plan selected from URL or session
  const planFromUrl = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useSessionStorage<PlanType>('selectedPlan', getPlanById(planFromUrl));
  
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  const [useStripePayment, setUseStripePayment] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use Stripe checkout hook with selected plan
  const { 
    isStripeProcessing, 
    handleStripeCheckout, 
    stripeCheckoutUrl,
    actualSubscription,
    isChecking
  } = useStripeCheckout(selectedPlan);
  
  // Check selected plan from URL on initial load
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
  
  // Get user's current subscription
  useEffect(() => {
    if (actualSubscription) {
      setCurrentSubscription(actualSubscription);
    } else {
      const fetchSubscription = async () => {
        if (user?.id) {
          try {
            const { data, error } = await supabase
              .from('user_balances')
              .select('subscription')
              .eq('id', user.id)
              .single();
              
            if (!error && data) {
              setCurrentSubscription(data.subscription);
            }
          } catch (error) {
            console.error('Failed to fetch subscription:', error);
          }
        }
      };
      
      fetchSubscription();
    }
  }, [user, actualSubscription]);
  
  // Toggle between Stripe and manual payment
  const togglePaymentMethod = useCallback(() => {
    setUseStripePayment(prev => !prev);
  }, []);
  
  // Handle Stripe checkout - reuse hook
  const initiateStripeCheckout = useCallback(() => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan pour continuer",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Initialisation du paiement Stripe pour le plan:", selectedPlan);
    handleStripeCheckout();
  }, [selectedPlan, handleStripeCheckout]);
  
  // Handle card form submission
  const handleCardFormSubmit = useCallback((cardData: PaymentFormData) => {
    setIsProcessing(true);
    // In a real case, we would process the payment here
    // For now, just simulate
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Paiement accepté",
        description: "Votre abonnement a été activé avec succès.",
        variant: "default"
      });
      navigate('/dashboard');
    }, 2000);
  }, [navigate]);
  
  return {
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
  };
};

export default usePaymentPage;
