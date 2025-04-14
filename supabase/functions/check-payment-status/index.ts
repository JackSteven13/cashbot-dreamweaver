
// supabase/functions/check-payment-status/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { isStripeConfigured, stripe } from "./helpers/stripeClient.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkPaymentStatus } from "./services/paymentService.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    if (!isStripeConfigured || !stripe) {
      throw new Error("Stripe is not configured properly");
    }
    
    // Parse request
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId parameter" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Get auth details
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Not authenticated");
    }
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );
    
    // Check user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error("Authentication failed");
    }
    
    console.log(`Checking payment status for session ${sessionId}`);
    
    // Check payment status
    const result = await checkPaymentStatus(sessionId, user.id);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
