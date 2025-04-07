
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@12.11.0'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Subscription plan mapping
const PLANS_BY_PRICE = {
  // Ces IDs seront générés dynamiquement par Stripe, il faudra les mettre à jour plus tard
  // en les extrayant des webhooks ou en les configurant manuellement
  'price_placeholder_starter': 'starter',
  'price_placeholder_gold': 'gold',
  'price_placeholder_elite': 'elite',
}

// Plan prices - ensure these match values in Edge Functions
const PLAN_PRICES = {
  'freemium': 0,
  'starter': 99,
  'gold': 349,
  'elite': 549
};

// Mapping for legacy "alpha" plan to new "starter" plan
const normalizeSubscriptionType = (planType: string): string => {
  if (planType === 'alpha') {
    console.log('Converting legacy plan "alpha" to "starter"');
    return 'starter';
  }
  return planType;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Get the stripe signature from the headers
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Stripe signature missing' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get the raw request body as text
    const body = await req.text()
    
    // Verify the webhook signature
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    let event
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log(`Received Stripe webhook event: ${event.type}`)
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        
        // Get user ID from the session
        const userId = session.client_reference_id
        let planMetadata = session.metadata?.plan
        
        if (!userId) {
          console.error('No user ID in session:', session.id)
          break
        }
        
        // Normalize plan type (convert "alpha" to "starter")
        planMetadata = normalizeSubscriptionType(planMetadata);
        
        let planType = planMetadata
        
        // If plan is not in metadata, try to determine from line items
        if (!planType) {
          const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
            session.id,
            { expand: ['line_items'] }
          )
          
          const priceId = sessionWithLineItems.line_items?.data[0]?.price?.id
          if (priceId && PLANS_BY_PRICE[priceId]) {
            planType = PLANS_BY_PRICE[priceId]
          } else {
            console.error('Could not determine plan type from session:', session.id)
            break
          }
        }
        
        console.log(`Updating user ${userId} subscription to ${planType}`)
        
        // Update user subscription in database
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ 
            subscription: planType,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          
        if (updateError) {
          console.error('Database update error:', updateError)
        }
        
        // Check if this is an upgrade and we need to cancel the previous subscription
        if (session.metadata?.subscription_to_cancel) {
          try {
            console.log(`This is an upgrade. Cancelling previous subscription: ${session.metadata.subscription_to_cancel}`);
            
            // Cancel the old subscription at end of billing period to avoid double-billing
            await stripe.subscriptions.update(session.metadata.subscription_to_cancel, {
              cancel_at_period_end: true,
              metadata: {
                cancelled_reason: 'upgrade',
                upgraded_to: planType
              }
            });
            
            console.log(`Previous subscription ${session.metadata.subscription_to_cancel} scheduled for cancellation at period end`);
            
            // Check if we need to apply a prorated credit as coupon
            if (session.metadata?.apply_prorated_credit === 'true') {
              const customerId = session.customer;
              
              if (customerId) {
                console.log(`Applying prorated credit to customer ${customerId} for upgrade from ${session.metadata.previousPlan} to ${planType}`);
                
                // Create a coupon for the customer with the prorated credit amount
                // Implementation would depend on your specific proration strategy
                // This could be done via Stripe credits or custom tracking
              }
            }
          } catch (cancelError) {
            console.error('Error cancelling previous subscription:', cancelError);
            // Continue despite error - the upgrade still worked
          }
        }
        
        break
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer
        
        // Get subscription metadata to check if it's a proration-related update
        const metadata = subscription.metadata || {};
        
        // If this is a cancellation due to upgrade, we can skip updating the plan
        // since the upgrade already set the correct plan
        if (metadata.cancelled_reason === 'upgrade') {
          console.log(`Skipping subscription update for ${subscription.id} as it was cancelled due to upgrade to ${metadata.upgraded_to}`);
          break;
        }
        
        // Get the price ID from the subscription
        const priceId = subscription.items.data[0]?.price?.id
        
        if (!priceId || !PLANS_BY_PRICE[priceId]) {
          console.log('Searching for plan by price lookup key');
          
          // Try to match the subscription to a plan based on price
          let matchedPlan = null;
          const amount = subscription.items.data[0]?.price?.unit_amount;
          if (amount) {
            const amountEuros = amount / 100;
            
            // Find matching plan
            for (const [plan, price] of Object.entries(PLAN_PRICES)) {
              if (price === amountEuros) {
                console.log(`Matched subscription amount ${amountEuros}€ to plan ${plan}`);
                matchedPlan = plan;
                break;
              }
            }
          }
          
          if (!matchedPlan) {
            console.error('Could not determine plan from price:', priceId);
            break;
          }
        }
        
        // Get user ID from customer ID
        const { data: users, error: userError } = await supabase
          .from('user_balances')
          .select('id')
          .eq('stripe_customer_id', customerId)
          
        if (userError || !users || users.length === 0) {
          console.error('Could not find user with customer ID:', customerId);
          break;
        }
        
        const userId = users[0].id;
        
        // Update the subscription status
        const newPlan = event.type === 'customer.subscription.deleted' 
          ? 'freemium' 
          : normalizeSubscriptionType(PLANS_BY_PRICE[priceId]);
        
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ 
            subscription: newPlan,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Database update error:', updateError);
        }
        
        break;
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
