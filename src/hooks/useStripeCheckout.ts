
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

      // Pour les tests de développement uniquement - simuler un checkout Stripe réussi
      console.log("Simulating Stripe checkout for", selectedPlan, "plan");
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mettre à jour l'abonnement de l'utilisateur directement pour les tests
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
      
      setIsStripeProcessing(false);
      toast({
        title: "Paiement réussi",
        description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
      });
      navigate('/dashboard');

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
