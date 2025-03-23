
import { useState, useCallback } from 'react';
import { PlanType } from './types';
import { createCheckoutSession } from './paymentService';
import { getReferralCodeFromURL } from './utils';

/**
 * Hook for creating and managing Stripe checkout sessions
 */
export const useStripeSession = () => {
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const createStripeSession = useCallback(async (plan: PlanType, referralCode: string | null) => {
    try {
      console.log(`Creating Stripe session for plan ${plan}${referralCode ? ` with referral code ${referralCode}` : ''}`);
      
      const data = await createCheckoutSession(
        plan,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/offres`,
        referralCode
      );
      
      if (data?.url) {
        console.log("Stripe checkout URL obtained:", data.url);
        setStripeCheckoutUrl(data.url);
        return { success: true, url: data.url };
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      if (retryCount < 2) {
        console.log(`Retrying (${retryCount + 1}/3)...`);
        setRetryCount(retryCount + 1);
        // Short wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return createStripeSession(plan, referralCode);
      }
      throw error;
    }
  }, [retryCount]);

  const getEffectiveReferralCode = () => {
    return getReferralCodeFromURL();
  };

  return {
    stripeCheckoutUrl,
    createStripeSession,
    getEffectiveReferralCode
  };
};
