
// Limites de sessions selon le forfait
export const SESSION_LIMITS = {
  'freemium': 1,      // 1 session par jour
  'starter': 10,      // 10 sessions par jour (augmenté de 3)
  'gold': 30,         // 30 sessions par jour (augmenté de 10)  
  'elite': 60         // 60 sessions par jour (augmenté de 50)
};

// Limites de revenus journaliers selon le forfait - AJUSTÉES POUR GARANTIR UN PROFIT
export const DAILY_REVENUE_LIMITS = {
  'freemium': 0.50,   // 0,50€ par jour
  'starter': 5.00,    // 5€ par jour (augmenté de 2€)
  'gold': 15.00,      // 15€ par jour (augmenté de 5€)
  'elite': 25.00      // 25€ par jour (augmenté de 15€)
};

// Taux de commission pour le parrainage selon l'abonnement
export const COMMISSION_RATES = {
  'freemium': 0.20,   // 20% de commission
  'starter': 0.30,    // 30% de commission
  'gold': 0.40,       // 40% de commission
  'elite': 0.50       // 50% de commission
};

// Taux de commission récurrente selon l'abonnement
export const RECURRING_COMMISSION_RATES = {
  'freemium': 0.0,    // 0% de commission récurrente
  'starter': 0.10,    // 10% de commission récurrente
  'gold': 0.20,       // 20% de commission récurrente
  'elite': 0.30       // 30% de commission récurrente
};

// Taux de commission niveau 2 selon l'abonnement
export const LEVEL2_COMMISSION_RATES = {
  'freemium': 0.0,    // 0% de commission niveau 2
  'starter': 0.0,     // 0% de commission niveau 2
  'gold': 0.05,       // 5% de commission niveau 2
  'elite': 0.10       // 10% de commission niveau 2
};

// Seuils de retrait selon l'abonnement - ALIGNÉS AVEC LES SEUILS GLOBAUX
export const WITHDRAWAL_THRESHOLDS = {
  'freemium': 20,     // 20€ minimum
  'starter': 15,      // 15€ minimum
  'gold': 10,         // 10€ minimum
  'elite': 5          // 5€ minimum
};

// Export SUBSCRIPTION_LIMITS pour la compatibilité avec d'autres fichiers
export const SUBSCRIPTION_LIMITS = DAILY_REVENUE_LIMITS;

// Créer un export unifié pour faciliter l'importation
export default {
  SESSION_LIMITS,
  DAILY_REVENUE_LIMITS,
  COMMISSION_RATES,
  RECURRING_COMMISSION_RATES,
  LEVEL2_COMMISSION_RATES,
  WITHDRAWAL_THRESHOLDS,
  SUBSCRIPTION_LIMITS
};
