
/**
 * Synchronise parfaitement les revenus avec le nombre de publicités
 * pour garantir une cohérence des données.
 */
export const synchronizeRevenueWithAds = (adsCount: number): number => {
  // Ce ratio fixe est utilisé dans tout le système pour garantir la cohérence
  const PERFECT_CORRELATION_RATIO = 0.76203;
  
  // Calcul du revenu avec précision à 2 décimales
  return Math.round(adsCount * PERFECT_CORRELATION_RATIO * 100) / 100;
};

/**
 * Calcule les statistiques globales à partir des valeurs centralisées
 */
export const getGlobalStats = async (): Promise<{adsCount: number, revenueCount: number}> => {
  try {
    // Récupérer les statistiques depuis la base de données
    // Pour l'instant on utilise des valeurs fixes jusqu'à la mise en place d'une API
    const BASE_ADS_COUNT = 152847;
    const BASE_REVENUE_COUNT = synchronizeRevenueWithAds(BASE_ADS_COUNT);
    
    return {
      adsCount: BASE_ADS_COUNT,
      revenueCount: BASE_REVENUE_COUNT
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques globales", error);
    // Valeurs par défaut en cas d'erreur
    return {
      adsCount: 150000,
      revenueCount: synchronizeRevenueWithAds(150000)
    };
  }
};
