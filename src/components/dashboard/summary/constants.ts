
// Limites de sessions selon le forfait
export const SESSION_LIMITS = {
  'freemium': 1,      // 1 session par jour
  'starter': 3,       // 3 sessions par jour
  'gold': 10,         // 10 sessions par jour  
  'elite': 50         // 50 sessions par jour
};

// Limites de revenus journaliers selon le forfait - ALIGNÉES AVEC LES LIMITES GLOBALES
export const DAILY_REVENUE_LIMITS = {
  'freemium': 0.50,   // 0,50€ par jour
  'starter': 2.00,    // 2€ par jour (corrigé à partir de 5€)
  'gold': 5.00,       // 5€ par jour (corrigé à partir de 20€)
  'elite': 15.00      // 15€ par jour (corrigé à partir de 50€)
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
  'freemium': 20,     // 20€ minimum (corrigé à partir de 200€)
  'starter': 15,      // 15€ minimum (corrigé à partir de 100€)
  'gold': 10,         // 10€ minimum (corrigé à partir de 50€)
  'elite': 5          // 5€ minimum (corrigé à partir de 25€)
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
