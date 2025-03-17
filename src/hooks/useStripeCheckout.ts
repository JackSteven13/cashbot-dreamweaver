
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from '@/hooks/usePaymentProcessing';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);

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
      // Get user session
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

      // Call Supabase Edge Function to create a Stripe checkout session
      console.log("Calling Stripe checkout for", selectedPlan, "plan");
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan: selectedPlan,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/offres`
        }
      });
      
      if (error) {
        console.error("Function error:", error);
        throw new Error(`Erreur de service: ${error.message}`);
      }
      
      if (data?.error) {
        console.error("Stripe configuration error:", data.error);
        throw new Error(data.error);
      }
      
      console.log("Stripe checkout response:", data);
      
      // If it's a free plan, we're done
      if (data.free) {
        toast({
          title: "Abonnement activé",
          description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
        });
        navigate('/payment-success');
        return;
      }
      
      // Redirect to Stripe checkout URL
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Aucune URL de paiement retournée");
      }

    } catch (error: any) {
      console.error("Payment error:", error);
      setIsStripeProcessing(false);
      
      // Create a more user-friendly error message
      let errorMessage;
      
      // Check for specific error patterns
      if (error.message?.includes('No such price')) {
        errorMessage = "La configuration des prix n'est pas encore terminée. Veuillez réessayer ultérieurement.";
      } else if (error.message?.includes('Invalid API Key')) {
        errorMessage = "Configuration de paiement incorrecte. Veuillez contacter le support.";
      } else if (error.message?.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = "Le service de paiement est temporairement indisponible. Veuillez réessayer dans quelques instants.";
      } else {
        // Use the original error message or a generic one
        errorMessage = error.message || "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.";
      }
      
      toast({
        title: "Erreur de paiement",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return {
    isStripeProcessing,
    handleStripeCheckout
  };
};
