
// Taux de commission pour les parrainages directs (montant perçu sur l'abonnement du filleul)
export const COMMISSION_RATES = {
  'freemium': 0.2,  // 20%
  'starter': 0.3,   // 30% 
  'gold': 0.4,      // 40%
  'elite': 0.5      // 50%
};

// Taux de commission récurrente (pourcentage perçu chaque mois)
export const RECURRING_COMMISSION_RATES = {
  'freemium': 0,     // 0%
  'starter': 0.05,   // 5%
  'gold': 0.1,       // 10%
  'elite': 0.15      // 15%
};

// Taux de commission pour le niveau 2 (filleuls de filleuls)
export const LEVEL2_COMMISSION_RATES = {
  'freemium': 0,     // 0%
  'starter': 0,      // 0%
  'gold': 0.05,      // 5%
  'elite': 0.1       // 10%
};
