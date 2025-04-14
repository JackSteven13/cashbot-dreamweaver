
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [actualSubscription, setActualSubscription] = useState<string | null>(null);

  // Check current subscription from Supabase
  const checkSubscription = async () => {
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
          setActualSubscription(data.subscription);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setIsChecking(false);
    }
  };

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

      // Créer la session de paiement
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

      // Stocker l'URL de paiement mais ne pas rediriger automatiquement
      setStripeCheckoutUrl(data.url);
      
      toast({
        title: "Session de paiement créée",
        description: "Cliquez sur le bouton pour finaliser votre paiement",
        duration: 5000,
      });
      
      // On ne redirige plus automatiquement
      setIsStripeProcessing(false);

    } catch (error: any) {
      console.error("Erreur de paiement:", error);
      setIsStripeProcessing(false);
      
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors de la préparation du paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // Check subscription when the hook is initialized
  useEffect(() => {
    checkSubscription();
  }, []);

  return {
    isStripeProcessing,
    handleStripeCheckout,
    stripeCheckoutUrl,
    isChecking,
    actualSubscription
  };
};
