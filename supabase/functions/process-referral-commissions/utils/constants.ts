
// Frais Stripe approximatifs (2.9% + 0.30€)
export const STRIPE_PERCENTAGE_FEE = 0.029;
export const STRIPE_FIXED_FEE = 0.30;

// Plans et leurs prix annuels
export const PLAN_PRICES = {
  'freemium': 0,
  'starter': 99,
  'gold': 349,
  'elite': 549,
  // Valeur par défaut pour les plans non reconnus
  'default': 99
};

// Taux de commission par plan
export const COMMISSION_RATES = {
  'freemium': 0.2,    // 20%
  'starter': 0.3,     // 30%
  'gold': 0.4,        // 40%
  'elite': 0.5,       // 50%
  'default': 0.2      // 20% par défaut
};
