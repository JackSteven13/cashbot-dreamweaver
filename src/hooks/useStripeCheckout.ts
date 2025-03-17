
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

      // Note: This is a simulation of Stripe checkout
      console.log("Simulating Stripe checkout for", selectedPlan, "plan");
      
      // Générer un ID de transaction fictif pour simuler une transaction Stripe
      const stripeTransactionId = `simulated_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Enregistrer le log de paiement simulé dans Supabase
      const { error: logError } = await supabase
        .from('transactions')
        .insert([{
          user_id: session.user.id,
          date: new Date().toISOString().split('T')[0],
          gain: 0, // Puisque c'est un paiement, pas un gain
          report: `Paiement Stripe simulé: Abonnement ${selectedPlan}. Transaction ID: ${stripeTransactionId}`
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
      console.log(`Paiement Stripe simulé réussi. ID de transaction: ${stripeTransactionId}`);
      console.log(`Abonnement ${selectedPlan} activé pour l'utilisateur ${session.user.id}`);
      console.log(`Dans un environnement de production, Stripe enverrait un e-mail à ${session.user.email}`);
      
      setIsStripeProcessing(false);
      toast({
        title: "Paiement réussi",
        description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
      });
      navigate('/payment-success');

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
