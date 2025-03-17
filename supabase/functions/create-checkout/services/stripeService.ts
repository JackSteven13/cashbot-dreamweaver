
import { stripe } from '../helpers/stripeClient.ts';

// Function to create or get products and prices
export async function getOrCreatePrice(planName: string, amount: number) {
  try {
    // Look for existing prices with matching lookup key
    const lookupKey = `${planName.toLowerCase()}_monthly`;
    const existingPrices = await stripe?.prices.list({
      active: true,
      lookup_keys: [lookupKey],
      limit: 1,
    });
    
    if (existingPrices?.data.length && existingPrices.data.length > 0) {
      console.log(`Found existing price for ${planName} plan:`, existingPrices.data[0].id);
      return existingPrices.data[0].id;
    }
    
    // Create a product first
    console.log(`Creating new product for ${planName} plan`);
    const product = await stripe?.products.create({
      name: `${planName} Monthly Subscription`,
      description: `${planName} tier monthly subscription`,
      metadata: {
        plan_type: planName,
      }
    });
    
    if (!product) {
      throw new Error("Failed to create product - Stripe not properly configured");
    }
    
    // Convert to cents and ensure it's a proper integer using Math.round
    const amountInCents = Math.round(amount * 100);
    
    console.log(`Creating new price for ${planName} plan with amount: ${amountInCents} cents`);
    const newPrice = await stripe?.prices.create({
      unit_amount: amountInCents,
      currency: 'eur',
      recurring: { interval: 'month' },
      product: product.id,
      lookup_key: lookupKey,
      metadata: {
        plan_type: planName,
      }
    });
    
    if (!newPrice) {
      throw new Error("Failed to create price - Stripe not properly configured");
    }
    
    console.log(`Created new price for ${planName} plan:`, newPrice.id);
    return newPrice.id;
  } catch (error) {
    console.error(`Error creating product/price for ${planName}:`, error);
    throw error;
  }
}

// Create a checkout session for a given plan
export async function createCheckoutSession({
  userId,
  userEmail,
  plan,
  successUrl,
  cancelUrl,
  referrerId
}: {
  userId: string;
  userEmail: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
  referrerId: string | null;
}) {
  try {
    // Plan price mapping in euros
    const PLAN_PRICES: Record<string, number> = {
      'pro': 19.99,
      'visionnaire': 49.99,
      'alpha': 99.99
    };
    
    // Ensure the plan is valid
    if (!PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
      throw new Error(`Invalid plan: ${plan}`);
    }
    
    // Get or create price ID for the selected plan
    const priceId = await getOrCreatePrice(plan, PLAN_PRICES[plan as keyof typeof PLAN_PRICES]);
    
    if (!priceId) {
      throw new Error(`Could not determine price ID for plan: ${plan}`);
    }
    
    // Create the checkout session with the price ID
    const session = await stripe?.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || 'https://cashbot.com/payment-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl || 'https://cashbot.com/payment-cancelled',
      client_reference_id: userId,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        plan: plan,
        referrerId: referrerId || '',
      },
    });
    
    if (!session) {
      throw new Error("Failed to create checkout session - Stripe not properly configured");
    }
    
    console.log('Created checkout session:', session.id);
    return session;
  } catch (error) {
    console.error('Stripe error:', error);
    throw error;
  }
}
