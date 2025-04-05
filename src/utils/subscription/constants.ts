
// Subscription plans and their limits
export const SUBSCRIPTION_LIMITS = {
  'freemium': 0.5,
  'starter': 5,
  'gold': 20,
  'elite': 50
};

// Base percentages for manual boost sessions
export const MANUAL_SESSION_GAIN_PERCENTAGES = {
  'freemium': { min: 0.10, max: 0.20 },  // 10-20% of daily limit
  'starter': { min: 0.05, max: 0.15 },   // 5-15% of daily limit
  'gold': { min: 0.03, max: 0.10 },      // 3-10% of daily limit
  'elite': { min: 0.02, max: 0.08 }      // 2-8% of daily limit
};

// Withdrawal thresholds by subscription level
export const WITHDRAWAL_THRESHOLDS = {
  'freemium': 200, // Théorique seulement - les comptes freemium ne peuvent pas retirer
  'starter': 100,
  'gold': 100,
  'elite': 100
};

// Withdrawal fee structure
export const WITHDRAWAL_FEES = {
  // Pour les comptes de moins de 6 mois
  earlyAccount: {
    'freemium': 1.0,    // 100% (impossible en pratique)
    'starter': 0.5,     // 50%
    'gold': 0.4,        // 40%
    'elite': 0.3        // 30%
  },
  // Pour les comptes de plus de 6 mois
  matureAccount: {
    'freemium': 1.0,    // 100% (impossible en pratique)
    'starter': 0.3,     // 30%
    'gold': 0.2,        // 20%
    'elite': 0.15       // 15%
  }
};
