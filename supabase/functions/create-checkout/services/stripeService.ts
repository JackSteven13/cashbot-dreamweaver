
import { stripe, isStripeConfigured } from '../helpers/stripeClient.ts';

export interface CreateCheckoutParams {
  userId: string;
  userEmail: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
  referrerId?: string | null;
  currentSubscription?: string | null;
  blockTestCards?: boolean;
}

const PRICES = {
  freemium: null,
  starter: "price_starter_monthly", // Your actual price ID for starter
  gold: "price_gold_monthly", // Your actual price ID for gold
  elite: "price_elite_monthly" // Your actual price ID for elite
};

export async function createCheckoutSession(params: CreateCheckoutParams) {
  if (!isStripeConfigured || !stripe) {
    throw new Error('Stripe is not configured properly');
  }
  
  const { userId, userEmail, plan, successUrl, cancelUrl, referrerId, currentSubscription, blockTestCards } = params;
  
  // Skip Stripe for free plan
  if (plan === 'freemium') {
    throw new Error('Cannot create checkout session for freemium plan');
  }
  
  // Get price ID for the plan
  const priceId = PRICES[plan as keyof typeof PRICES];
  if (!priceId) {
    throw new Error(`Invalid plan: ${plan}`);
  }
  
  // Find customer if exists, or create new one
  let customerId: string;
  const existingCustomers = await stripe.customers.list({
    email: userEmail,
    limit: 1
  });
  
  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
    console.log(`Using existing customer: ${customerId}`);
  } else {
    const newCustomer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        userId,
        referrerId: referrerId || ''
      }
    });
    customerId = newCustomer.id;
    console.log(`Created new customer: ${customerId}`);
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    client_reference_id: userId,
    subscription_data: {
      metadata: {
        userId,
        referrerId: referrerId || '',
        previousPlan: currentSubscription || 'none'
      }
    },
    metadata: {
      userId,
      plan,
      referrerId: referrerId || ''
    },
    // Toujours bloquer les cartes de test en production
    payment_method_options: {
      card: {
        statement_descriptor_suffix: 'StreamGenius',
        setup_future_usage: 'off_session',
        // This blocks test cards in production
        setup_mandate: 'card_testing_not_allowed'
      }
    }
  });
  
  console.log(`Created checkout session: ${session.id}`);
  return session;
}
