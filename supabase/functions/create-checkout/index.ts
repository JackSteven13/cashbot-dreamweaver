
import { corsHeaders } from './helpers/corsHeaders.ts';
import { isStripeConfigured } from './helpers/stripeClient.ts';
import { findReferrer } from './services/referralService.ts';
import { createCheckoutSession } from './services/stripeService.ts';
import { updateFreeSubscription } from './services/subscriptionService.ts';
import { supabase } from './helpers/supabaseClient.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check if Stripe is properly configured
    if (!isStripeConfigured) {
      console.error('Stripe is not properly configured. Please check the STRIPE_SECRET_KEY environment variable.');
      return new Response(JSON.stringify({ 
        error: 'Stripe is not properly configured. Please contact the administrator.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Extract authorization token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No Authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Parse request body
    const { plan, successUrl, cancelUrl, referralCode } = await req.json();
    console.log('Received plan:', plan, 'Referral code:', referralCode || 'none');
    
    // Find referrer if referral code provided
    const referrerId = await findReferrer(referralCode);
    console.log('Referrer ID:', referrerId || 'none');
    
    // Validate plan
    if (!plan || !['freemium', 'pro', 'visionnaire', 'alpha'].includes(plan)) {
      console.error('Invalid plan:', plan);
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // If it's a free plan, just update the user's subscription
    if (plan === 'freemium') {
      console.log('Handling freemium plan subscription');
      try {
        const result = await updateFreeSubscription(user.id, plan, referrerId);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // For paid plans, create a Stripe checkout session
    console.log(`Creating Stripe checkout session for plan: ${plan}`);
    
    try {
      const session = await createCheckoutSession({
        userId: user.id,
        userEmail: user.email || '',
        plan,
        successUrl: successUrl || '',
        cancelUrl: cancelUrl || '',
        referrerId
      });
      
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
