
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { getReferralCodeFromURL, formatErrorMessage, updateLocalSubscription } from './utils';
import { createCheckoutSession } from './paymentService';

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

    // Pour freemium, update subscription directement sans Stripe
    if (selectedPlan === 'freemium') {
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
        
        const { error } = await supabase
          .from('user_balances')
          .update({ 
            subscription: selectedPlan,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
          
        if (error) throw error;
        
        // Mettre à jour localStorage immédiatement
        await updateLocalSubscription(selectedPlan);
        
        toast({
          title: "Abonnement Freemium activé",
          description: "Votre abonnement Freemium a été activé avec succès !",
        });
        
        navigate('/dashboard');
        return;
      } catch (error) {
        console.error("Error updating subscription:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'activation de votre abonnement.",
          variant: "destructive"
        });
        return;
      }
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

      // Get referral code from URL parameter
      const effectiveReferralCode = getReferralCodeFromURL();

      // Call Supabase Edge Function to create a Stripe checkout session
      console.log("Calling Stripe checkout for", selectedPlan, "plan", effectiveReferralCode ? `with referral: ${effectiveReferralCode}` : "without referral");
      
      const data = await createCheckoutSession(
        selectedPlan,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/offres`,
        effectiveReferralCode
      );
      
      // If it's a free plan, we're done
      if (data.free) {
        // Mettre à jour localStorage immédiatement
        await updateLocalSubscription(selectedPlan);
        
        toast({
          title: "Abonnement activé",
          description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
        });
        navigate('/payment-success');
        return;
      }
      
      // Update localStorage preemptively to reduce UI flicker
      // (will be confirmed in PaymentSuccess page)
      await updateLocalSubscription(selectedPlan);
      
      // Redirect to Stripe checkout URL
      if (data?.url) {
        console.log("Redirecting to Stripe checkout URL:", data.url);
        
        // Enhanced redirect method
        try {
          // Create a hidden anchor element to force a proper navigation
          const link = document.createElement('a');
          link.href = data.url;
          link.target = '_blank'; // Open in new tab to avoid navigation issues
          link.rel = 'noopener noreferrer';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          
          // After a short delay, also try direct location change as fallback
          setTimeout(() => {
            window.location.href = data.url;
          }, 100);
          
          toast({
            title: "Redirection en cours",
            description: "Si la page de paiement ne s'ouvre pas automatiquement, veuillez cliquer à nouveau sur le bouton.",
          });
        } catch (redirectError) {
          console.error("Redirect error:", redirectError);
          // Fallback to direct location change
          window.location.href = data.url;
        }
      } else {
        throw new Error("Aucune URL de paiement retournée");
      }

    } catch (error: any) {
      console.error("Payment error:", error);
      setIsStripeProcessing(false);
      
      const errorMessage = formatErrorMessage(error);
      
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
