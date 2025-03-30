
// Limites de gains quotidiens par abonnement
export const SUBSCRIPTION_LIMITS = {
  'freemium': 0.5,   // 0.5€ par jour
  'starter': 5,      // 5€ par jour
  'gold': 20,        // 20€ par jour
  'elite': 50        // 50€ par jour
};

// Taux de commission directs
export const COMMISSION_RATES = {
  'freemium': 0.4,   // 40%
  'starter': 0.6,    // 60%
  'gold': 0.8,       // 80%
  'elite': 1.0       // 100%
};

// Taux de commission récurrents
export const RECURRING_COMMISSION_RATES = {
  'freemium': 0,     // 0%
  'starter': 0.1,    // 10%
  'gold': 0.2,       // 20%
  'elite': 0.3       // 30%
};

// Taux de commission niveau 2
export const LEVEL2_COMMISSION_RATES = {
  'freemium': 0,     // 0%
  'starter': 0,      // 0%
  'gold': 0.05,      // 5%
  'elite': 0.1       // 10%
};

// Seuils de retrait par abonnement
export const WITHDRAWAL_THRESHOLDS = {
  'freemium': 200,   // 200€
  'starter': 400,    // 400€
  'gold': 700,       // 700€
  'elite': 1000      // 1000€
};

// Labels des abonnements
export const SUBSCRIPTION_LABELS = {
  'freemium': 'Freemium',
  'starter': 'Starter',
  'gold': 'Gold',
  'elite': 'Élite'
};
