
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export type PlanType = 'freemium' | 'pro' | 'visionnaire' | 'alpha';

// Plan prices
export const PLAN_PRICES = {
  'freemium': 0,
  'pro': 19.99,
  'visionnaire': 49.99,
  'alpha': 99.99
};

export type PaymentFormData = {
  cardNumber: string;
  expiry: string;
  cvc: string;
};

export const usePaymentProcessing = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const validateCardPayment = (cardNumber: string, expiry: string, cvc: string) => {
    // Basic form validation
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      toast({
        title: "Erreur",
        description: "Numéro de carte invalide",
        variant: "destructive"
      });
      return false;
    }

    if (!expiry || expiry.length !== 5) {
      toast({
        title: "Erreur",
        description: "Date d'expiration invalide",
        variant: "destructive"
      });
      return false;
    }

    if (!cvc || cvc.length !== 3) {
      toast({
        title: "Erreur",
        description: "Code CVC invalide",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

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

      // For freemium plan, update directly without payment
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

      // For paid plans, use Stripe Checkout
      const token = session.access_token;
      const response = await fetch(`${window.location.origin}/api/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/offres`,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // If it's a free plan that was processed on the server
      if (data.free) {
        setIsProcessing(false);
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
