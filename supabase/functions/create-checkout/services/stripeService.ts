
import { stripe } from '../helpers/stripeClient.ts';

// Function to create or get products and prices
export async function getOrCreatePrice(planName: string, amount: number) {
  try {
    // Look for existing prices with matching lookup key
    const lookupKey = `${planName.toLowerCase()}_annual`;
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
      name: `${planName} Annual Subscription`,
      description: `${planName} tier annual subscription`,
      metadata: {
        plan_type: planName,
      }
    });
    
    if (!product) {
      throw new Error("Failed to create product - Stripe not properly configured");
    }
    
    // Convert to cents and ensure it's a proper integer using Math.round
    // Use Math.round to avoid floating point precision issues
    const amountInCents = Math.round(amount * 100);
    
    console.log(`Creating new price for ${planName} plan with amount: ${amountInCents} cents (from ${amount} EUR)`);
    const newPrice = await stripe?.prices.create({
      unit_amount: amountInCents,
      currency: 'eur',
      recurring: { interval: 'year' },
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
  referrerId,
  currentSubscription
}: {
  userId: string;
  userEmail: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
  referrerId: string | null;
  currentSubscription?: string | null;
}) {
  try {
    // Plan price mapping in euros - ensure these match values in client
    const PLAN_PRICES: Record<string, number> = {
      'freemium': 0,
      'starter': 99,
      'gold': 349,
      'elite': 549
    };
    
    // Ensure the plan is valid and different from current subscription
    if (!PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
      throw new Error(`Invalid plan: ${plan}`);
    }
    
    // If downgrading or same plan, don't apply proration logic
    const isUpgrade = currentSubscription && 
                      currentSubscription !== 'freemium' && 
                      PLAN_PRICES[plan as keyof typeof PLAN_PRICES] > PLAN_PRICES[currentSubscription as keyof typeof PLAN_PRICES];
    
    console.log(`Processing plan ${plan} with price ${PLAN_PRICES[plan as keyof typeof PLAN_PRICES]} EUR`);
    
    // First, try to find the customer in Stripe
    let customerId: string | undefined;
    const customers = await stripe?.customers.list({
      email: userEmail,
      limit: 1
    });
    
    if (customers?.data.length && customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`Found existing Stripe customer:`, customerId);
    } else {
      // Create a new customer if not found
      const customer = await stripe?.customers.create({
        email: userEmail,
        metadata: {
          userId: userId
        }
      });
      customerId = customer?.id;
      console.log(`Created new Stripe customer:`, customerId);
    }
    
    // Get or create price ID for the selected plan
    const priceId = await getOrCreatePrice(plan, PLAN_PRICES[plan as keyof typeof PLAN_PRICES]);
    
    if (!priceId) {
      throw new Error(`Could not determine price ID for plan: ${plan}`);
    }
    
    // Find existing subscriptions for the customer to handle proration
    let sessionConfig: any = {
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
      customer_email: customerId ? undefined : userEmail,
      customer: customerId,
      metadata: {
        userId: userId,
        plan: plan,
        referrerId: referrerId || '',
        isUpgrade: isUpgrade ? 'true' : 'false',
        previousPlan: currentSubscription || '',
      },
      // Add UI customization to improve visibility
      custom_text: {
        submit: {
          message: 'Merci de compléter votre paiement pour activer votre abonnement'
        }
      },
      // Set locale to French for better user experience
      locale: 'fr',
      // Ensure checkout uses a popup/redirect method
      ui_mode: 'hosted',
    };
    
    // If this is an upgrade from an existing subscription, try to find active subscription
    if (isUpgrade && customerId) {
      const subscriptions = await stripe?.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });
      
      // If there's an active subscription and we're upgrading, enable proration
      if (subscriptions?.data.length && subscriptions.data.length > 0) {
        const currentSubscriptionId = subscriptions.data[0].id;
        console.log(`Found active subscription for upgrade:`, currentSubscriptionId);
        
        // Find the current subscription phase to calculate remainingTime
        const currentPhase = subscriptions.data[0].current_period_end;
        const now = Math.floor(Date.now() / 1000);
        const remainingTime = currentPhase - now;
        const totalPeriod = 365 * 24 * 60 * 60; // One year in seconds
        
        // Calculate prorated amount based on remaining time
        const currentPlanPrice = PLAN_PRICES[currentSubscription as keyof typeof PLAN_PRICES];
        const newPlanPrice = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
        const proratedCredit = (currentPlanPrice * remainingTime) / totalPeriod;
        const upgradeCost = newPlanPrice - proratedCredit;
        
        console.log(`Proration calculation: Current plan: ${currentPlanPrice}€, New plan: ${newPlanPrice}€`);
        console.log(`Remaining time: ${remainingTime}s of ${totalPeriod}s (${(remainingTime/totalPeriod*100).toFixed(2)}%)`);
        console.log(`Prorated credit: ${proratedCredit.toFixed(2)}€, Final upgrade cost: ${upgradeCost.toFixed(2)}€`);
        
        // Use Stripe's subscription upgrade feature
        // Set subscription_data.billing_cycle_anchor to "now" for immediate upgrade
        sessionConfig.subscription_data = {
          metadata: {
            upgrade_from: currentSubscription,
            prorated_credit: proratedCredit.toFixed(2),
            upgrade_cost: upgradeCost.toFixed(2)
          }
        };
        
        // For proration, we'll cancel the old subscription when the new one is created successfully
        // This is handled in the webhook
        sessionConfig.metadata.subscription_to_cancel = currentSubscriptionId;
        sessionConfig.metadata.apply_prorated_credit = 'true';
      }
    }
    
    // Create the checkout session with the price ID
    const session = await stripe?.checkout.sessions.create(sessionConfig);
    
    if (!session) {
      throw new Error("Failed to create checkout session - Stripe not properly configured");
    }
    
    console.log('Created checkout session:', session.id, 'with URL:', session.url);
    return session;
  } catch (error) {
    console.error('Stripe error:', error);
    throw error;
  }
}
