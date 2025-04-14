
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  // Add actualSubscription and isChecking state
  const [actualSubscription, setActualSubscription] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Function to check current subscription
  const checkCurrentSubscription = async () => {
    setIsChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('user_balances')
          .select('subscription')
          .eq('id', session.user.id)
          .single();
        
        if (!error && data) {
          console.log('Subscription verified from Supabase:', data.subscription);
          setActualSubscription(data.subscription);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setIsChecking(false);
    }
  };
  
  // Check subscription on hook initialization
  useState(() => {
    checkCurrentSubscription();
  });

  const handleStripeCheckout = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan",
        variant: "destructive"
      });
      return;
    }

    setIsStripeProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour effectuer cette action",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Create and manage Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan: selectedPlan,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/offres`
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }

      if (!data?.url) {
        throw new Error("Impossible de créer la session de paiement");
      }

      setStripeCheckoutUrl(data.url);
      
      // Direct redirection to Stripe (simplified approach)
      window.location.href = data.url;

    } catch (error: any) {
      console.error("Erreur de paiement:", error);
      setIsStripeProcessing(false);
      
      toast({
        title: "Erreur de paiement",
        description: error.message || "Une erreur est survenue lors du traitement du paiement",
        variant: "destructive"
      });
    }
  };

  return {
    isStripeProcessing,
    handleStripeCheckout,
    stripeCheckoutUrl,
    actualSubscription,
    isChecking
  };
};
