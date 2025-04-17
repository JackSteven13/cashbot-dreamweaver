
/**
 * Subscription package daily limits and settings
 */

// Maximum revenue per day based on subscription package
export const SUBSCRIPTION_LIMITS = {
  freemium: 0.5, // €0.50 per day (freemium users)
  starter: 2.0, // €2.00 per day (starter package)
  gold: 5.0,   // €5.00 per day (gold package)
  elite: 15.0  // €15.00 per day (elite package)
};

// Base manual session gains as percentages of daily limits
export const MANUAL_SESSION_GAIN_PERCENTAGES = {
  freemium: { min: 0.05, max: 0.15 }, // 5-15% of daily limit per session
  starter: { min: 0.05, max: 0.20 },  // 5-20% of daily limit per session 
  gold: { min: 0.10, max: 0.25 },     // 10-25% of daily limit per session
  elite: { min: 0.15, max: 0.30 }     // 15-30% of daily limit per session
};

// Minimum withdrawal amounts based on subscription
export const WITHDRAWAL_THRESHOLDS = {
  freemium: 20, // €20 minimum withdrawal (freemium)
  starter: 15,  // €15 minimum withdrawal (starter)
  gold: 10,     // €10 minimum withdrawal (gold)
  elite: 5      // €5 minimum withdrawal (elite)
};

// Withdrawal fees based on subscription (percentage)
export const WITHDRAWAL_FEES = {
  freemium: 5, // 5% withdrawal fee
  starter: 3,  // 3% withdrawal fee
  gold: 1.5,   // 1.5% withdrawal fee
  elite: 0     // No withdrawal fee
};
