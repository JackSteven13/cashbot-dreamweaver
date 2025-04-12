
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import useSessionStorage from '@/hooks/useSessionStorage';
import { PaymentFormData, PlanType } from '@/utils/plans';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const usePaymentPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthChecking } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useSessionStorage<string | null>('selectedPlan', null);
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  const [useStripePayment, setUseStripePayment] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  
  // Retrieve user's current subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .rpc('get_current_subscription', { user_id: user.id });
            
          if (!error && data) {
            setCurrentSubscription(data);
          }
        } catch (error) {
          console.error('Failed to fetch subscription:', error);
        }
      }
    };
    
    fetchSubscription();
  }, [user]);
  
  // Toggle between Stripe and manual payment
  const togglePaymentMethod = useCallback(() => {
    setUseStripePayment(prev => !prev);
    setStripeCheckoutUrl(null);
  }, []);
  
  // Handle Stripe checkout
  const initiateStripeCheckout = useCallback(async () => {
    if (!user || !selectedPlan) return;
    
    try {
      setIsStripeProcessing(true);
      // Call your Stripe checkout endpoint here
      // For now we'll simulate with a timeout
      setTimeout(() => {
        // In a real implementation, this would be the URL returned from your backend
        const mockCheckoutUrl = `https://checkout.stripe.com/${Date.now()}`;
        setStripeCheckoutUrl(mockCheckoutUrl);
        toast({
          title: "Prêt pour le paiement",
          description: "Vous allez être redirigé vers la page de paiement sécurisée.",
          variant: "default"
        });
      }, 1500);
    } catch (error) {
      console.error('Failed to initiate Stripe checkout:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser le paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsStripeProcessing(false);
    }
  }, [user, selectedPlan]);
  
  // Handle manual card form submission
  const handleCardFormSubmit = useCallback((cardData: PaymentFormData) => {
    setIsProcessing(true);
    // Simulate processing
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
