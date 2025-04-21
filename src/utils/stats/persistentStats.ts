
/**
 * Utilitaire pour gérer les statistiques persistantes (compteurs de publicités et de revenus)
 */

interface PersistentStats {
  adsCount: number;
  revenueCount: number;
}

const STORAGE_KEYS = {
  globalAdsCount: 'global_stats_ads_count',
  globalRevenueCount: 'global_stats_revenue_count',
  userAdsCount: (userId: string) => `stats_ads_count_${userId}`,
  userRevenueCount: (userId: string) => `stats_revenue_count_${userId}`
};

/**
 * Récupère les statistiques persistantes
 * @param userId Identifiant utilisateur optionnel
 * @returns Statistiques récupérées
 */
export const getPersistentStats = (userId?: string): PersistentStats => {
  try {
    // Essayer de récupérer les statistiques spécifiques à l'utilisateur si un ID est fourni
    if (userId) {
      const userAdsCount = localStorage.getItem(STORAGE_KEYS.userAdsCount(userId));
      const userRevenueCount = localStorage.getItem(STORAGE_KEYS.userRevenueCount(userId));
      
      if (userAdsCount && userRevenueCount) {
        return {
          adsCount: parseFloat(userAdsCount),
          revenueCount: parseFloat(userRevenueCount)
        };
      }
    }
    
    // Sinon, récupérer les statistiques globales
    const globalAdsCount = localStorage.getItem(STORAGE_KEYS.globalAdsCount);
    const globalRevenueCount = localStorage.getItem(STORAGE_KEYS.globalRevenueCount);
    
    return {
      adsCount: globalAdsCount ? parseFloat(globalAdsCount) : 1000 + Math.floor(Math.random() * 2000),
      revenueCount: globalRevenueCount ? parseFloat(globalRevenueCount) : 500 + Math.floor(Math.random() * 1000)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    
    // En cas d'erreur, retourner des valeurs par défaut
    return {
      adsCount: 1000 + Math.floor(Math.random() * 2000),
      revenueCount: 500 + Math.floor(Math.random() * 1000)
    };
  }
};

/**
 * Enregistre les statistiques persistantes
 * @param adsCount Nombre de publicités
 * @param revenueCount Montant des revenus
 * @param userId Identifiant utilisateur optionnel
 */
export const savePersistentStats = (adsCount: number, revenueCount: number, userId?: string): void => {
  try {
    // Toujours s'assurer que les nouvelles valeurs sont valides et ne sont pas inférieures aux valeurs actuelles
    const currentStats = getPersistentStats(userId);
    
    const safeAdsCount = Math.max(
      currentStats.adsCount,
      isNaN(adsCount) ? currentStats.adsCount : adsCount
    );
    
    const safeRevenueCount = Math.max(
      currentStats.revenueCount,
      isNaN(revenueCount) ? currentStats.revenueCount : revenueCount
    );
    
    // Enregistrer les statistiques spécifiques à l'utilisateur si un ID est fourni
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.userAdsCount(userId), safeAdsCount.toString());
      localStorage.setItem(STORAGE_KEYS.userRevenueCount(userId), safeRevenueCount.toString());
    }
    
    // Toujours mettre à jour les statistiques globales
    localStorage.setItem(STORAGE_KEYS.globalAdsCount, safeAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.globalRevenueCount, safeRevenueCount.toString());
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des statistiques:', error);
  }
};

/**
 * Incrémente les statistiques persistantes
 * @param adsIncrement Incrément pour les publicités
 * @param revenueIncrement Incrément pour les revenus
 * @param userId Identifiant utilisateur optionnel
 * @returns Nouvelles statistiques après incrémentation
 */
export const incrementPersistentStats = (
  adsIncrement: number, 
  revenueIncrement: number, 
  userId?: string
): PersistentStats => {
  try {
    const currentStats = getPersistentStats(userId);
    
    // Calculer les nouvelles valeurs
    const newAdsCount = currentStats.adsCount + Math.max(0, adsIncrement);
    const newRevenueCount = currentStats.revenueCount + Math.max(0, revenueIncrement);
    
    // Enregistrer les nouvelles valeurs
    savePersistentStats(newAdsCount, newRevenueCount, userId);
    
    return {
      adsCount: newAdsCount,
      revenueCount: newRevenueCount
    };
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation des statistiques:', error);
    return getPersistentStats(userId);
  }
};
