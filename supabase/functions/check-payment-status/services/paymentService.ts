
// supabase/functions/check-payment-status/services/paymentService.ts
import { stripe } from "../helpers/stripeClient.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function checkPaymentStatus(sessionId: string, userId: string) {
  try {
    console.log(`Retrieving checkout session: ${sessionId}`);
    
    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return { status: "error", message: "Session not found" };
    }
    
    console.log(`Session status: ${session.status}, payment_status: ${session.payment_status}`);
    
    // Check if payment is completed
    if (session.status === "complete" && session.payment_status === "paid") {
      // If payment is complete, update the user's subscription in Supabase
      await updateUserSubscription(userId, session);
      
      return { 
        status: "complete", 
        plan: session.metadata?.plan || null,
        customer_email: session.customer_details?.email || null
      };
    }
    
    // If payment is still in progress
    if (session.status === "open") {
      return { status: "open" };
    }
    
    // If payment failed or was cancelled
    return { status: "incomplete", reason: session.status };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return { status: "error", message: error.message };
  }
}

async function updateUserSubscription(userId: string, session: any) {
  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Get the plan from metadata
    const plan = session.metadata?.plan || "starter";
    
    console.log(`Updating subscription for user ${userId} to ${plan}`);
    
    // Update user's subscription in the database
    const { error } = await supabaseAdmin
      .from("user_balances")
      .update({ 
        subscription: plan,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);
    
    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
    
    console.log(`Successfully updated subscription for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return false;
  }
}
