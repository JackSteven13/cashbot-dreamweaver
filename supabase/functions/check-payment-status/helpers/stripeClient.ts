
// supabase/functions/check-payment-status/helpers/stripeClient.ts
import Stripe from "https://esm.sh/stripe@12.0.0";

// Get the Stripe secret key from environment variables
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

export const isStripeConfigured = Boolean(stripeKey);

export const stripe = isStripeConfigured ? new Stripe(stripeKey as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
}) : null;

if (!isStripeConfigured) {
  console.warn("Stripe is not configured: missing STRIPE_SECRET_KEY");
}
