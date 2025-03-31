
// Daily limit per subscription type in euros
export const SUBSCRIPTION_LIMITS = {
  'freemium': 0.5,
  'starter': 5,
  'gold': 20,
  'elite': 50
};

// Withdrawal fees by subscription
export const WITHDRAWAL_FEES = {
  'freemium': 0.15, // 15%
  'starter': 0.10,  // 10%
  'gold': 0.05,     // 5%
  'elite': 0.02     // 2%
};

// Withdrawal threshold by subscription
export const WITHDRAWAL_THRESHOLDS = {
  'freemium': 200,
  'starter': 400,
  'gold': 700,
  'elite': 1000
};

// Session limits per subscription type
export const SESSION_LIMITS = {
  'freemium': 1,
  'starter': 'unlimited',
  'gold': 'unlimited',
  'elite': 'unlimited'
};
