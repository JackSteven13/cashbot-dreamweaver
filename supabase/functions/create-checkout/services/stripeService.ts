
import { stripe, isStripeConfigured } from '../helpers/stripeClient.ts';

export interface CreateCheckoutParams {
  userId: string;
  userEmail: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
  referrerId?: string | null;
  currentSubscription?: string | null;
  blockTestCards?: boolean;
}

// Configuration des prix par plan - version simplifiée sans ID codés en dur
const PLANS = {
  freemium: null,
  starter: {
    name: "Starter",
    price: 99,
    interval: "year"
  },
  gold: {
    name: "Gold",
    price: 349,
    interval: "year"
  },
  elite: {
    name: "Elite",
    price: 549,
    interval: "year"
  }
};

export async function createCheckoutSession(params: CreateCheckoutParams) {
  if (!isStripeConfigured || !stripe) {
    throw new Error('Stripe is not configured properly');
  }
  
  const { userId, userEmail, plan, successUrl, cancelUrl, referrerId, currentSubscription } = params;
  
  // Skip Stripe for free plan
  if (plan === 'freemium') {
    throw new Error('Cannot create checkout session for freemium plan');
  }
  
  // Vérifier que le plan existe
  const planData = PLANS[plan as keyof typeof PLANS];
  if (!planData) {
    throw new Error(`Invalid plan: ${plan}`);
  }
  
  // Find customer if exists, or create new one
  let customerId: string;
  const existingCustomers = await stripe.customers.list({
    email: userEmail,
    limit: 1
  });
  
  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
    console.log(`Using existing customer: ${customerId}`);
  } else {
    const newCustomer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        userId,
        referrerId: referrerId || ''
      }
    });
    customerId = newCustomer.id;
    console.log(`Created new customer: ${customerId}`);
  }
  
  // Créer une session de checkout avec des paramètres simplifiés
  const sessionParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${planData.name} - Abonnement annuel`,
            description: `Abonnement ${planData.name} StreamGenius`
          },
          unit_amount: planData.price * 100, // Conversion en centimes
          recurring: {
            interval: planData.interval
          }
        },
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    client_reference_id: userId,
    metadata: {
      userId,
      plan,
      referrerId: referrerId || ''
    }
  };
  
  // Ajouter les métadonnées d'abonnement de manière sécurisée
  const subscriptionData: Record<string, any> = {
    metadata: {
      userId,
      referrerId: referrerId || '',
      previousPlan: currentSubscription || 'none'
    }
  };
  
  // Session de checkout complète
  const session = await stripe.checkout.sessions.create({
    ...sessionParams,
    subscription_data: subscriptionData
  });
  
  console.log(`Created checkout session: ${session.id}`);
  return session;
}
