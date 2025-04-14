
import { corsHeaders } from './helpers/corsHeaders.ts';
import { isStripeConfigured } from './helpers/stripeClient.ts';
import { findReferrer, trackReferral } from './services/referralService.ts';
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
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { plan, successUrl, cancelUrl, referralCode } = requestData;
    console.log('Received plan:', plan, 'Referral code:', referralCode || 'none');
    
    // Find referrer if referral code provided
    let referrerId = null;
    if (referralCode) {
      console.log('Recherche du parrain pour le code:', referralCode);
      referrerId = await findReferrer(referralCode);
      console.log('Parrain trouvé:', referrerId || 'aucun');
      
      if (referrerId === user.id) {
        console.log('Auto-parrainage détecté, ignoré');
        referrerId = null;
      }
    }
    
    // Validate plan
    if (!plan || !['freemium', 'starter', 'gold', 'elite'].includes(plan)) {
      console.error('Invalid plan:', plan);
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get user's current subscription
    const { data: userData, error: userDataError } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', user.id)
      .single();
      
    if (userDataError) {
      console.error('Error fetching user subscription:', userDataError);
      // Continue without current subscription data
    }
    
    const currentSubscription = userData?.subscription || 'freemium';
    console.log(`User's current subscription:`, currentSubscription);
    
    // If changing to the same plan, inform the user
    if (currentSubscription === plan) {
      return new Response(JSON.stringify({ 
        error: 'Vous êtes déjà abonné à ce forfait.', 
        code: 'SAME_PLAN' 
      }), {
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
        console.error('Error updating subscription:', error);
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // For paid plans, create a Stripe checkout session
    console.log(`Creating Stripe checkout session for plan: ${plan}`);
    
    try {
      // Toujours bloquer les cartes de test en production
      const session = await createCheckoutSession({
        userId: user.id,
        userEmail: user.email || '',
        plan,
        successUrl: successUrl || '',
        cancelUrl: cancelUrl || '',
        referrerId,
        currentSubscription,
        blockTestCards: true  // Forcer le blocage des cartes de test
      });
      
      // If referral code is provided, track it even before payment completion
      // This ensures we don't lose the referral data
      if (referrerId) {
        console.log(`Pre-tracking referral: ${referrerId} -> ${user.id} for plan ${plan}`);
        try {
          await trackReferral(referrerId, user.id, plan);
        } catch (refError) {
          console.error('Error pre-tracking referral:', refError);
          // Continue anyway as this is just a pre-tracking
        }
      }
      
      return new Response(JSON.stringify({ success: true, url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return new Response(JSON.stringify({ 
        error: `Payment processing error: ${String(stripeError)}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ 
      error: `General error: ${String(error)}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
