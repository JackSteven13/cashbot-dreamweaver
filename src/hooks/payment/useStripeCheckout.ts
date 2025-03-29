
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

  // Effect to open Stripe page as soon as URL is available
  useEffect(() => {
    if (stripeCheckoutUrl && isStripeProcessing) {
      console.log("Opening Stripe URL:", stripeCheckoutUrl);
      
      // Try to open in new window first
      try {
        // Short delay to make sure the browser doesn't block the popup
        setTimeout(() => {
          openStripeWindow(stripeCheckoutUrl);
          
          // Show a toast with a button to manually open in case popup was blocked
          setTimeout(() => {
            showStripeManualOpenToast(stripeCheckoutUrl);
          }, 500);
        }, 100);
      } catch (err) {
        console.error("Error opening Stripe window:", err);
        // Fallback to direct redirect
        window.location.href = stripeCheckoutUrl;
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
      console.log("Payment already in progress, using stored URL if available");
      if (stripeCheckoutUrl) {
        openStripeWindow(stripeCheckoutUrl);
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
