
import Stripe from 'https://esm.sh/stripe@12.11.0';

// Get the Stripe secret key from environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

// Validate Stripe key format before using
const isValidStripeKey = stripeSecretKey && (stripeSecretKey.startsWith('sk_test_') || stripeSecretKey.startsWith('sk_live_'));
if (!isValidStripeKey) {
  console.error('Invalid Stripe secret key format. Keys should start with sk_test_ or sk_live_');
}

console.log('Initializing Stripe with key format:', isValidStripeKey ? (stripeSecretKey.startsWith('sk_test_') ? 'Test Mode' : 'Live Mode') : 'Invalid');

// Initialize Stripe with the secret key
export const stripe = isValidStripeKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
}) : null;

export const isStripeConfigured = isValidStripeKey && stripe !== null;
