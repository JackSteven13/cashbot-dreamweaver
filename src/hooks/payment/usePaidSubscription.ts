
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { formatErrorMessage, getReferralCodeFromURL, updateLocalSubscription } from './utils';
import { PlanType } from './types';
import { createCheckoutSession } from './paymentService';

/**
 * Handles processing paid subscriptions through Stripe
 */
export const usePaidSubscription = () => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  
  const processPaidSubscription = async (selectedPlan: PlanType) => {
    setIsStripeProcessing(true);
    
    try {
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
        
        // Forcer le rafraîchissement des données au retour sur le dashboard
        localStorage.setItem('forceRefreshBalance', 'true');
        
        toast({
          title: "Abonnement activé",
          description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
        });
        navigate('/payment-success');
        return true;
      }
      
      // Update localStorage preemptively to reduce UI flicker
      localStorage.setItem('subscription', selectedPlan);
      
      // Force refresh on dashboard return
      localStorage.setItem('forceRefreshBalance', 'true');
      
      // Redirect to Stripe checkout URL
      if (data?.url) {
        console.log("Redirecting to Stripe checkout URL:", data.url);
        window.location.href = data.url;
        return true;
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
      return false;
    }
  };
  
  return {
    isStripeProcessing,
    processPaidSubscription,
    setIsStripeProcessing
  };
};
