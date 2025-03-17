
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType, PaymentFormData } from './types';
import { validateCardPayment } from './utils';
import { createCheckoutSession } from './paymentService';

export const usePaymentProcessing = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = async (formData: PaymentFormData) => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Aucun plan sélectionné",
        variant: "destructive"
      });
      return;
    }

    // Validate card data
    const isValid = validateCardPayment(
      formData.cardNumber, 
      formData.expiry, 
      formData.cvc
    );

    if (!isValid) {
      return;
    }

    setIsProcessing(true);

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

      // For free plan, update directly without payment
      if (selectedPlan === 'freemium') {
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ 
            subscription: selectedPlan,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
          
        if (updateError) {
          throw updateError;
        }

        setIsProcessing(false);
        toast({
          title: "Abonnement activé",
          description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
        });
        navigate('/dashboard');
        return;
      }

      // For paid plans with manual card form, redirect to Stripe checkout
      console.log("Redirecting to Stripe checkout for", selectedPlan);
      
      const data = await createCheckoutSession(
        selectedPlan,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/offres`,
        null
      );
      
      console.log("Stripe checkout response:", data);
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Aucune URL de paiement retournée");
      }

    } catch (error) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  return {
    isProcessing,
    processPayment
  };
};
