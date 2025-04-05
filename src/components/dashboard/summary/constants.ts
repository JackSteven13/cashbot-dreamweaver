
// Re-export des constantes depuis le fichier de constantes principal
export { 
  SUBSCRIPTION_LIMITS,
  MANUAL_SESSION_GAIN_PERCENTAGES,
  WITHDRAWAL_THRESHOLDS,
  WITHDRAWAL_FEES 
} from '@/utils/subscription/constants';

// Commission rates for referrals - base percentage depends on subscription
export const COMMISSION_RATES = {
  'freemium': 0.2,   // 20% commission
  'starter': 0.3,    // 30% commission
  'gold': 0.4,       // 40% commission
  'elite': 0.5       // 50% commission
};

// Recurring commission rates for referrals (monthly)
export const RECURRING_COMMISSION_RATES = {
  'freemium': 0,     // No recurring commission
  'starter': 0.1,    // 10% recurring commission
  'gold': 0.2,       // 20% recurring commission
  'elite': 0.3       // 30% recurring commission
};

// Level 2 commission rates (commissions from referrals of referrals)
export const LEVEL2_COMMISSION_RATES = {
  'freemium': 0,     // No level 2 commission
  'starter': 0,      // No level 2 commission
  'gold': 0.05,      // 5% level 2 commission
  'elite': 0.1       // 10% level 2 commission
};
