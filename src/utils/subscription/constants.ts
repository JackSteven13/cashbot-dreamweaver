
/**
 * Subscription package daily limits and settings
 */

// Maximum revenue per day based on subscription package
export const SUBSCRIPTION_LIMITS = {
  freemium: 0.5,  // €0.50 par jour (freemium)
  starter: 5.0,   // €5.00 par jour (starter)
  gold: 15.0,     // €15.00 par jour (gold)
  elite: 25.0     // €25.00 par jour (elite)
};

// Base manual session gains as percentages of daily limits
export const MANUAL_SESSION_GAIN_PERCENTAGES = {
  freemium: { min: 0.05, max: 0.15 }, // 5-15% of daily limit per session
  starter: { min: 0.05, max: 0.20 },  // 5-20% of daily limit per session 
  gold: { min: 0.10, max: 0.25 },     // 10-25% of daily limit per session
  elite: { min: 0.15, max: 0.30 }     // 15-30% of daily limit per session
};

// Minimum withdrawal amounts based on subscription - SUPÉRIEUR sur chaque offre que le précédent
export const WITHDRAWAL_THRESHOLDS = {
  freemium: 300, // €300 minimum withdrawal (freemium)
  starter: 600,  // €600 minimum withdrawal (starter)
  gold: 1200,    // €1200 minimum withdrawal (gold)
  elite: 2500    // €2500 minimum withdrawal (elite)
};

// Withdrawal fees based on subscription (percentage)
export const WITHDRAWAL_FEES = {
  freemium: 5, // 5% withdrawal fee
  starter: 3,  // 3% withdrawal fee
  gold: 1.5,   // 1.5% withdrawal fee
  elite: 0     // No withdrawal fee
};
