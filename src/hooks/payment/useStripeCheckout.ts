
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { formatErrorMessage, updateLocalSubscription } from './utils';
import { useSubscriptionCheck } from './useSubscriptionCheck';
import { useStripeSession } from './useStripeSession';
import { useFreemiumUpdate } from './useFreemiumUpdate';
import { openStripeWindow } from './stripeWindowManager';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [didInitiateRedirect, setDidInitiateRedirect] = useState(false);
  
  const { actualSubscription, isChecking, recheckSubscription } = useSubscriptionCheck();
  const { stripeCheckoutUrl, createStripeSession, getEffectiveReferralCode } = useStripeSession();
  const { updateToFreemium } = useFreemiumUpdate();

  // Perform redirect to Stripe checkout as soon as URL is available
  useEffect(() => {
    if (stripeCheckoutUrl && isStripeProcessing && !didInitiateRedirect) {
      console.log("stripeWindowManager: Redirecting to Stripe URL:", stripeCheckoutUrl);
      
      // Track that we've initiated a redirect to prevent multiple attempts
      setDidInitiateRedirect(true);
      
      // Open the Stripe window using our dedicated module
      openStripeWindow(stripeCheckoutUrl);
      
      // Show a toast notification to ensure users are aware of the redirect
      toast({
        title: "Redirection en cours",
        description: "Vous allez être redirigé vers la page de paiement Stripe.",
        duration: 10000, 
      });
    }
  }, [stripeCheckoutUrl, isStripeProcessing, didInitiateRedirect]);

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
      
      // If we already have a URL and user is trying again, force a redirect
      if (stripeCheckoutUrl) {
        console.log("Re-attempting redirect to existing URL:", stripeCheckoutUrl);
        openStripeWindow(stripeCheckoutUrl);
        
        toast({
          title: "Nouvelle tentative de redirection",
          description: "Nous essayons à nouveau de vous rediriger vers la page de paiement.",
          duration: 5000
        });
      }
      return;
    }
    
    console.log("Starting Stripe checkout process for plan:", selectedPlan);
    setIsStripeProcessing(true);
    setDidInitiateRedirect(false); // Reset for new checkout attempt

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
      
      if (!result || !result.url) {
        throw new Error("Impossible de créer la session de paiement");
      }

    } catch (error: any) {
      console.error("Payment error:", error);
      setIsStripeProcessing(false);
      setDidInitiateRedirect(false);
      
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
