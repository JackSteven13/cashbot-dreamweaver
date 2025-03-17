
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@12.11.0'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get the Stripe secret key from environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

// Validate Stripe key format before using
const isValidStripeKey = stripeSecretKey && (stripeSecretKey.startsWith('sk_test_') || stripeSecretKey.startsWith('sk_live_'));
if (!isValidStripeKey) {
  console.error('Invalid Stripe secret key format. Keys should start with sk_test_ or sk_live_');
}

console.log('Initializing Stripe with key format:', isValidStripeKey ? (stripeSecretKey.startsWith('sk_test_') ? 'Test Mode' : 'Live Mode') : 'Invalid');

// Initialize Stripe with the secret key
const stripe = isValidStripeKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
}) : null;

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Function to create or get products and prices
async function getOrCreatePrice(planName, amount) {
  try {
    // Look for existing prices with matching lookup key
    const lookupKey = `${planName.toLowerCase()}_monthly`;
    const existingPrices = await stripe.prices.list({
      active: true,
      lookup_keys: [lookupKey],
      limit: 1,
    });
    
    if (existingPrices.data.length > 0) {
      console.log(`Found existing price for ${planName} plan:`, existingPrices.data[0].id);
      return existingPrices.data[0].id;
    }
    
    // Create a product first
    console.log(`Creating new product for ${planName} plan`);
    const product = await stripe.products.create({
      name: `${planName} Monthly Subscription`,
      description: `${planName} tier monthly subscription`,
      metadata: {
        plan_type: planName,
      }
    });
    
    // Convert to cents and ensure it's a proper integer using Math.round
    const amountInCents = Math.round(amount * 100);
    
    // Create a price for the product
    console.log(`Creating new price for ${planName} plan with amount: ${amountInCents} cents`);
    const newPrice = await stripe.prices.create({
      unit_amount: amountInCents,
      currency: 'eur',
      recurring: { interval: 'month' },
      product: product.id,
      lookup_key: lookupKey,
      metadata: {
        plan_type: planName,
      }
    });
    
    console.log(`Created new price for ${planName} plan:`, newPrice.id);
    return newPrice.id;
  } catch (error) {
    console.error(`Error creating product/price for ${planName}:`, error);
    throw error;
  }
}

// Find referrer from referral code
async function findReferrer(referralCode) {
  if (!referralCode) return null;
  
  try {
    // Extract user ID from referral code (assuming format like "userId_abc123")
    const userId = referralCode.split('_')[0];
    if (!userId) return null;
    
    // Look up the user in the database
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (error || !data) {
      console.error("Error finding referrer:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Error processing referral code:", error);
    return null;
  }
}

// Function to track a referral
async function trackReferral(referrerId, newUserId, planType) {
  if (!referrerId || !newUserId) return;
  
  try {
    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_user_id: newUserId,
        plan_type: planType,
        status: 'active',
      });
      
    if (error) {
      console.error("Error tracking referral:", error);
    } else {
      console.log(`Referral tracked: ${referrerId} referred ${newUserId}`);
    }
  } catch (error) {
    console.error("Error in trackReferral:", error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Check if Stripe is properly configured
    if (!isValidStripeKey || !stripe) {
      console.error('Stripe is not properly configured. Please check the STRIPE_SECRET_KEY environment variable.')
      return new Response(JSON.stringify({ 
        error: 'Stripe is not properly configured. Please contact the administrator.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Extract authorization token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No Authorization header provided')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Verify the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Parse request body
    const { plan, successUrl, cancelUrl, referralCode } = await req.json()
    console.log('Received plan:', plan, 'Referral code:', referralCode || 'none')
    
    // Find referrer if referral code provided
    const referrerId = await findReferrer(referralCode)
    console.log('Referrer ID:', referrerId || 'none')
    
    // Validate plan
    if (!plan || !['freemium', 'pro', 'visionnaire', 'alpha'].includes(plan)) {
      console.error('Invalid plan:', plan)
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // If it's a free plan, just update the user's subscription
    if (plan === 'freemium') {
      console.log('Handling freemium plan subscription')
      // Update user subscription in database
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          subscription: plan,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        
      if (updateError) {
        console.error('Database update error:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      // Track referral if applicable
      if (referrerId) {
        await trackReferral(referrerId, user.id, plan)
      }
      
      return new Response(JSON.stringify({ success: true, free: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // For paid plans, create a Stripe checkout session
    console.log(`Creating Stripe checkout session for plan: ${plan}`)
    
    try {
      // Plan price mapping in euros
      const PLAN_PRICES = {
        'pro': 19.99,
        'visionnaire': 49.99,
        'alpha': 99.99
      };
      
      // Get or create price ID for the selected plan
      const priceId = await getOrCreatePrice(plan, PLAN_PRICES[plan]);
      
      if (!priceId) {
        throw new Error(`Could not determine price ID for plan: ${plan}`);
      }
      
      // Create the checkout session with the price ID
      const session = await stripe.checkout.sessions.create({
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
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: {
          userId: user.id,
          plan: plan,
          referrerId: referrerId || '',
        },
      });
      
      console.log('Created checkout session:', session.id);
      
      return new Response(JSON.stringify({ success: true, url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return new Response(JSON.stringify({ 
        error: `Payment processing error: ${stripeError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ 
      error: `General error: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
