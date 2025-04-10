
// Limites de sessions selon le forfait
export const SESSION_LIMITS = {
  'freemium': 1,      // 1 session par jour
  'starter': 3,       // 3 sessions par jour
  'gold': 10,         // 10 sessions par jour  
  'elite': 50         // 50 sessions par jour
};

// Limites de revenus journaliers selon le forfait 
export const DAILY_REVENUE_LIMITS = {
  'freemium': 0.50,   // 0,50€ par jour
  'starter': 5.00,    // 5€ par jour
  'gold': 20.00,      // 20€ par jour
  'elite': 50.00      // 50€ par jour
};

// Taux de commission pour le parrainage selon l'abonnement
export const COMMISSION_RATES = {
  'freemium': 0.20,   // 20% de commission
  'starter': 0.30,    // 30% de commission
  'gold': 0.40,       // 40% de commission
  'elite': 0.50       // 50% de commission
};

// Seuils de retrait selon l'abonnement
export const WITHDRAWAL_THRESHOLDS = {
  'freemium': 200,    // 200€ minimum
  'starter': 100,     // 100€ minimum
  'gold': 50,         // 50€ minimum
  'elite': 25         // 25€ minimum
};
