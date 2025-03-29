
// Plans et leurs limites de gains
export const SUBSCRIPTION_LIMITS = {
  'freemium': 0.5,
  'starter': 5,
  'gold': 20,
  'elite': 50
};

// Commission rates for referrals by plan type (standard rates)
export const COMMISSION_RATES = {
  'freemium': 0.35,    // 35% on first subscription
  'starter': 0.35,     // 35% + 10% recurring
  'gold': 0.35,        // 35% + 20% recurring + 5% level 2
  'elite': 0.35        // 35% + 30% recurring + 10% level 2
};

// Recurring commission rates
export const RECURRING_COMMISSION_RATES = {
  'freemium': 0,      // No recurring
  'starter': 0.1,     // 10% recurring
  'gold': 0.2,        // 20% recurring
  'elite': 0.3        // 30% recurring
};

// Level 2 commission rates
export const LEVEL2_COMMISSION_RATES = {
  'freemium': 0,      // No level 2
  'starter': 0,       // No level 2
  'gold': 0.05,       // 5% level 2
  'elite': 0.1        // 10% level 2
};

// Minimum withdrawal thresholds
export const WITHDRAWAL_THRESHOLDS = {
  'freemium': 200,
  'starter': 400,
  'gold': 700,
  'elite': 1000
};
