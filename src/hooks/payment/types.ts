
// Update the plan types to reflect new naming convention
export type PlanType = 'freemium' | 'starter' | 'gold' | 'elite';

// Update plan prices to annual pricing structure
export const PLAN_PRICES = {
  'freemium': 0,
  'starter': 99,
  'gold': 349,
  'elite': 549
};

export type PaymentFormData = {
  cardNumber: string;
  expiry: string;
  cvc: string;
};
