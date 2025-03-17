
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

      // Générer un ID de transaction fictif pour le paiement par carte
      const cardTransactionId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Carte utilisée (masquée pour la sécurité)
      const maskedCardNumber = formData.cardNumber.slice(-4).padStart(16, '*');
      
      console.log(`Simulation de paiement par carte pour le plan ${selectedPlan}`);
      console.log(`Transaction ID: ${cardTransactionId}`);
      console.log(`Carte utilisée: ${maskedCardNumber}, Expiration: ${formData.expiry}`);
      
      // Simuler un délai de traitement de paiement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Enregistrer le log de paiement simulé dans Supabase
      const { error: logError } = await supabase
        .from('transactions')
        .insert([{
          user_id: session.user.id,
          date: new Date().toISOString().split('T')[0],
          gain: 0, // Puisque c'est un paiement, pas un gain
          report: `Paiement par carte pour l'abonnement ${selectedPlan}. Transaction ID: ${cardTransactionId}. Carte: ${maskedCardNumber}`
        }]);
        
      if (logError) {
        console.error("Erreur lors de l'enregistrement du log de paiement:", logError);
      }
      
      // Mettre à jour l'abonnement de l'utilisateur
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
      
      // Log détaillé dans la console
      console.log(`Paiement par carte simulé réussi pour ${session.user.email}`);
      console.log(`Abonnement ${selectedPlan} activé pour l'utilisateur ${session.user.id}`);
      console.log(`Montant facturé: ${PLAN_PRICES[selectedPlan]}€`);
      
      setIsProcessing(false);
      toast({
        title: "Paiement réussi",
        description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
      });
      navigate('/payment-success');

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
