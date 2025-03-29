
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { formatErrorMessage, updateLocalSubscription } from './utils';
import { useSubscriptionCheck } from './useSubscriptionCheck';
import { useStripeSession } from './useStripeSession';
import { useFreemiumUpdate } from './useFreemiumUpdate';
import { openStripeWindow, showStripeManualOpenToast } from './stripeWindowManager';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  
  const { actualSubscription, isChecking, recheckSubscription } = useSubscriptionCheck();
  const { stripeCheckoutUrl, createStripeSession, getEffectiveReferralCode } = useStripeSession();
  const { updateToFreemium } = useFreemiumUpdate();

  // Effect to handle Stripe URL when available - simplified for reliability
  useEffect(() => {
    if (stripeCheckoutUrl && isStripeProcessing) {
      console.log("Stripe URL available, preparing to open:", stripeCheckoutUrl);
      
      // First show the toast to ensure the user always has a way to access the payment page
      showStripeManualOpenToast(stripeCheckoutUrl);
      
      // Direct redirection is more reliable across browsers
      try {
        // Short delay to ensure the toast is visible before possibly navigating away
        setTimeout(() => {
          window.location.href = stripeCheckoutUrl;
        }, 500);
      } catch (err) {
        console.error("Error redirecting to Stripe:", err);
        // Toast is already showing so user can click manually
      }
    }
  }, [stripeCheckoutUrl, isStripeProcessing]);

  const handleStripeCheckout = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan",
        variant: "destructive"
      });
      return;
    }

    // Check current subscription again
    const currentSub = await recheckSubscription();
    
    // If user is already subscribed to this plan, show a message and redirect
    if (currentSub === selectedPlan) {
      toast({
        title: "Abonnement déjà actif",
        description: `Vous êtes déjà abonné au forfait ${selectedPlan}. Vous allez être redirigé vers votre tableau de bord.`,
      });
      // Force a data refresh
      localStorage.setItem('forceRefreshBalance', 'true');
      navigate('/dashboard');
      return;
    }

    // For freemium, update subscription directly without Stripe
    if (selectedPlan === 'freemium') {
      const success = await updateToFreemium();
      if (success) {
        navigate('/dashboard');
      }
      return;
    }

    if (isStripeProcessing) {
      console.log("Payment already in progress");
      if (stripeCheckoutUrl) {
        // If we already have a URL, just redirect to it
        window.location.href = stripeCheckoutUrl;
      }
      return;
    }
    
    console.log("Starting Stripe checkout process for plan:", selectedPlan);
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
      const effectiveReferralCode = getEffectiveReferralCode();
      console.log("Referral code for checkout:", effectiveReferralCode || "none");
      
      // Update localStorage preemptively to reduce UI flicker
      localStorage.setItem('subscription', selectedPlan);
      
      // Force refresh on dashboard return
      localStorage.setItem('forceRefreshBalance', 'true');
      
      // Create and handle Stripe checkout session
      const result = await createStripeSession(selectedPlan, effectiveReferralCode);
      console.log("Stripe session created:", result);

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
    handleStripeCheckout,
    actualSubscription,
    isChecking,
    stripeCheckoutUrl
  };
};
