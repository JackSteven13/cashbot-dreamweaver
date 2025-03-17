
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
const isValidStripeKey = stripeSecretKey && stripeSecretKey.startsWith('sk_');
if (!isValidStripeKey) {
  console.error('Invalid Stripe secret key format. Keys should start with sk_');
}

console.log('Initializing Stripe with key format:', isValidStripeKey ? 'Valid (sk_*)' : 'Invalid');

// Initialize Stripe with the secret key
const stripe = isValidStripeKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
}) : null;

// Define subscription plan IDs
// Update with the actual product IDs
const PLAN_IDS = {
  'freemium': 'free',
  'pro': 'price_1OWlHbPpjKfOPBSRnBzNBRIY',     // Will be updated with price ID from the product
  'visionnaire': 'price_1OWlIEPpjKfOPBSROvnx6rKo', 
  'alpha': 'price_1OWlJ1PpjKfOPBSRmxkRZmjC',     
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

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
    
    // First, try to get the price ID for the pro product
    if (PLAN_IDS['pro'] === 'price_1OWlHbPpjKfOPBSRnBzNBRIY') {
      try {
        // Look up prices for the provided product ID
        console.log('Looking up prices for product ID: prod_RopJPyaRmXWQ1V');
        const prices = await stripe.prices.list({
          product: 'prod_RopJPyaRmXWQ1V',
          active: true,
        });
        
        if (prices.data.length > 0) {
          // Use the first active price
          PLAN_IDS['pro'] = prices.data[0].id;
          console.log(`Found price ID for Pro plan: ${PLAN_IDS['pro']}`);
        } else {
          console.error('No active prices found for the Pro product');
        }
      } catch (priceError) {
        console.error('Error retrieving prices for Pro product:', priceError);
      }
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
    const { plan, successUrl, cancelUrl } = await req.json()
    console.log('Received plan:', plan)
    
    // Validate plan
    if (!plan || !PLAN_IDS[plan]) {
      console.error('Invalid plan:', plan)
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Create a Stripe checkout session
    const priceId = PLAN_IDS[plan]
    
    // If it's a free plan, just update the user's subscription
    if (priceId === 'free' || plan === 'freemium') {
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
      
      return new Response(JSON.stringify({ success: true, free: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log('Creating Stripe checkout session for plan:', plan, 'with price ID:', priceId)
    
    // For paid plans, create a Stripe checkout session
    try {
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
        },
      })
      
      console.log('Created checkout session:', session.id)
      
      return new Response(JSON.stringify({ success: true, url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (stripeError) {
      console.error('Stripe error:', stripeError)
      return new Response(JSON.stringify({ error: stripeError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
