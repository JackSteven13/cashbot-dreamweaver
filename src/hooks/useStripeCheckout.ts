
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from '@/hooks/usePaymentProcessing';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);

  const handleStripeCheckout = async () => {
    if (!selectedPlan || selectedPlan === 'freemium') {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan payant",
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

      const token = session.access_token;
      
      // Use the same domain as the current application
      const apiUrl = `${window.location.origin}/api/create-checkout`;
      console.log("Calling API at:", apiUrl);
      
      // Log the request body for debugging
      const requestBody = {
        plan: selectedPlan,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/offres`,
      };
      console.log("Request body:", JSON.stringify(requestBody));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API response error:", response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText || "Unknown error"}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // If it's a free plan that was processed on the server
      if (data.free) {
        setIsStripeProcessing(false);
        toast({
          title: "Abonnement activé",
          description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
        });
        navigate('/dashboard');
        return;
      }

      // Redirect to Stripe checkout page
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Aucune URL de paiement reçue");
    } catch (error) {
      console.error("Payment error:", error);
      setIsStripeProcessing(false);
      
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  return {
    isStripeProcessing,
    handleStripeCheckout
  };
};
