
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

// Define product ID mapping
const PRODUCT_IDS = {
  'pro': 'prod_RopJPyaRmXWQ1V',
  // Add other product IDs here if available
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
      
      return new Response(JSON.stringify({ success: true, free: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get or retrieve the price ID for the plan
    console.log(`Creating Stripe checkout session for plan: ${plan}`)
    
    // For paid plans, create a Stripe checkout session
    try {
      let priceId;
      
      // If it's the Pro plan, use the product ID to find the active price
      if (plan === 'pro' && PRODUCT_IDS['pro']) {
        try {
          console.log(`Looking up prices for product ID: ${PRODUCT_IDS['pro']}`);
          const prices = await stripe.prices.list({
            product: PRODUCT_IDS['pro'],
            active: true,
            limit: 1
          });
          
          if (prices.data.length > 0) {
            priceId = prices.data[0].id;
            console.log(`Found price ID for Pro plan: ${priceId}`);
          } else {
            throw new Error('No active prices found for the Pro product');
          }
        } catch (priceError) {
          console.error('Error retrieving prices for Pro product:', priceError);
          return new Response(JSON.stringify({ 
            error: 'Unable to retrieve pricing information for the Pro plan' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (plan === 'visionnaire') {
        // For Visionnaire plan, create a price if needed or use a hardcoded ID
        try {
          const prices = await stripe.prices.list({
            active: true,
            lookup_keys: ['visionnaire_monthly']
          });
          
          if (prices.data.length > 0) {
            priceId = prices.data[0].id;
          } else {
            // Create a new price for Visionnaire plan
            const newPrice = await stripe.prices.create({
              unit_amount: 4999, // 49.99 in cents
              currency: 'eur',
              recurring: { interval: 'month' },
              product_data: {
                name: 'Visionnaire Monthly Subscription'
              },
              lookup_key: 'visionnaire_monthly'
            });
            priceId = newPrice.id;
          }
          console.log(`Using price ID for Visionnaire plan: ${priceId}`);
        } catch (priceError) {
          console.error('Error with Visionnaire pricing:', priceError);
          return new Response(JSON.stringify({ 
            error: 'Unable to set up pricing for the Visionnaire plan' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (plan === 'alpha') {
        // For Alpha plan, create a price if needed or use a hardcoded ID
        try {
          const prices = await stripe.prices.list({
            active: true,
            lookup_keys: ['alpha_monthly']
          });
          
          if (prices.data.length > 0) {
            priceId = prices.data[0].id;
          } else {
            // Create a new price for Alpha plan
            const newPrice = await stripe.prices.create({
              unit_amount: 9999, // 99.99 in cents
              currency: 'eur',
              recurring: { interval: 'month' },
              product_data: {
                name: 'Alpha Monthly Subscription'
              },
              lookup_key: 'alpha_monthly'
            });
            priceId = newPrice.id;
          }
          console.log(`Using price ID for Alpha plan: ${priceId}`);
        } catch (priceError) {
          console.error('Error with Alpha pricing:', priceError);
          return new Response(JSON.stringify({ 
            error: 'Unable to set up pricing for the Alpha plan' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      if (!priceId) {
        throw new Error(`Could not determine price ID for plan: ${plan}`);
      }
      
      // Create the checkout session with the retrieved or created price ID
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
