
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
  
  // Plan sélectionné à partir de URL ou session
  const planFromUrl = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useSessionStorage<PlanType>('selectedPlan', getPlanById(planFromUrl));
  
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  const [useStripePayment, setUseStripePayment] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Utilisation du hook Stripe checkout avec le plan sélectionné
  const { 
    isStripeProcessing, 
    handleStripeCheckout, 
    stripeCheckoutUrl 
  } = useStripeCheckout(selectedPlan);
  
  // Vérifier le plan sélectionné à partir de l'URL lors du chargement initial
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
  }, [user]);
  
  // Toggle entre Stripe et paiement manuel
  const togglePaymentMethod = useCallback(() => {
    setUseStripePayment(prev => !prev);
  }, []);
  
  // Gérer le checkout Stripe - réutilisation du hook
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
  
  // Gestion du formulaire de carte
  const handleCardFormSubmit = useCallback((cardData: PaymentFormData) => {
    setIsProcessing(true);
    // Dans un cas réel, nous traiterions le paiement ici
    // Pour l'instant, nous simulons simplement
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
