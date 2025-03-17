
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
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  paypalEmail?: string;
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

  const validatePaypalPayment = (paypalEmail: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!paypalEmail || !emailRegex.test(paypalEmail)) {
      toast({
        title: "Erreur",
        description: "Adresse e-mail PayPal invalide",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const processPayment = async (paymentMethod: string, formData: PaymentFormData) => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Aucun plan sélectionné",
        variant: "destructive"
      });
      return;
    }

    // Validate based on payment method
    let isValid = false;
    if (paymentMethod === "card") {
      isValid = validateCardPayment(
        formData.cardNumber || '', 
        formData.expiry || '', 
        formData.cvc || ''
      );
    } else if (paymentMethod === "paypal") {
      isValid = validatePaypalPayment(formData.paypalEmail || '');
    }

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

      // Update user subscription in Supabase
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

      // Simulate payment processing delay
      setTimeout(() => {
        setIsProcessing(false);
        
        toast({
          title: "Paiement réussi",
          description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
        });
        
        // Redirect to dashboard after successful payment
        navigate('/dashboard');
      }, 2000);
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
