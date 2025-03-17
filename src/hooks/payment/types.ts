
export type PlanType = 'freemium' | 'pro' | 'visionnaire' | 'alpha';

// Plan prices - ensure these match values in Edge Functions
export const PLAN_PRICES = {
  'freemium': 0,
  'pro': 19.99,
  'visionnaire': 49.99,
  'alpha': 99.99
};

export type PaymentFormData = {
  cardNumber: string;
  expiry: string;
  cvc: string;
};
