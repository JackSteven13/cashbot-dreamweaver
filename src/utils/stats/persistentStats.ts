
import { getUserSpecificKeys } from '../balance/balanceStorage';

// Clés pour stocker les statistiques dans le localStorage
const GLOBAL_STATS_KEYS = {
  ADS_COUNT: 'global_stats_ads_count',
  REVENUE_COUNT: 'global_stats_revenue_count',
  LAST_UPDATE: 'global_stats_last_update',
};

// Fonction pour obtenir des clés spécifiques à l'utilisateur
const getUserStatsKeys = (userId: string) => ({
  adsCount: `stats_ads_count_${userId}`,
  revenueCount: `stats_revenue_count_${userId}`,
  lastUpdate: `stats_last_update_${userId}`,
});

/**
 * Récupère les statistiques persistantes
 * Assure que les valeurs ne diminuent jamais
 */
export const getPersistentStats = (userId?: string): { adsCount: number; revenueCount: number } => {
  try {
    // Valeurs par défaut avec progression aléatoire
    const baseAdsCount = 150000;
    const baseRevenueCount = 120000;
    
    // Récupérer les valeurs stockées
    let adsCount, revenueCount;
    
    if (userId) {
      // Utiliser des clés spécifiques à l'utilisateur si disponible
      const userKeys = getUserStatsKeys(userId);
      adsCount = parseFloat(localStorage.getItem(userKeys.adsCount) || '0');
      revenueCount = parseFloat(localStorage.getItem(userKeys.revenueCount) || '0');
    } else {
      // Sinon utiliser les clés globales
      adsCount = parseFloat(localStorage.getItem(GLOBAL_STATS_KEYS.ADS_COUNT) || '0');
      revenueCount = parseFloat(localStorage.getItem(GLOBAL_STATS_KEYS.REVENUE_COUNT) || '0');
    }
    
    // Vérifier si les valeurs sont valides
    const hasStoredValues = 
      !isNaN(adsCount) && adsCount > 0 && 
      !isNaN(revenueCount) && revenueCount > 0;
    
    // Log pour le débogage
    console.log("Using stored values:", {
      adsCount,
      revenueCount,
      hasStoredValues
    });
    
    if (hasStoredValues) {
      // Si les valeurs stockées sont valides, les utiliser
      return {
        adsCount,
        revenueCount
      };
    }
    
    // Si aucune valeur valide n'est trouvée, utiliser les valeurs par défaut
    const newAdsCount = baseAdsCount + Math.floor(Math.random() * 10000);
    const newRevenueCount = baseRevenueCount + Math.floor(Math.random() * 15000);
    
    console.log("Compteurs initialisés avec des valeurs cohérentes et progressives:", {
      adsCount: newAdsCount,
      revenueCount: newRevenueCount
    });
    
    // Persister les nouvelles valeurs
    savePersistentStats(newAdsCount, newRevenueCount, userId);
    
    return {
      adsCount: newAdsCount,
      revenueCount: newRevenueCount
    };
  } catch (e) {
    console.error("Erreur lors de la récupération des statistiques persistantes:", e);
    
    // Valeurs par défaut en cas d'erreur
    return {
      adsCount: 150000,
      revenueCount: 120000
    };
  }
};

/**
 * Sauvegarde les statistiques dans le stockage local
 * Garantit que les nouvelles valeurs sont toujours supérieures aux précédentes
 */
export const savePersistentStats = (
  newAdsCount: number, 
  newRevenueCount: number,
  userId?: string
): void => {
  try {
    // Récupérer les valeurs actuelles pour comparaison
    const currentStats = getPersistentStats(userId);
    
    // S'assurer que les nouvelles valeurs sont toujours supérieures aux précédentes
    const safeAdsCount = Math.max(currentStats.adsCount, newAdsCount);
    const safeRevenueCount = Math.max(currentStats.revenueCount, newRevenueCount);
    
    // Stocker les valeurs avec des clés spécifiques à l'utilisateur si disponible
    if (userId) {
      const userKeys = getUserStatsKeys(userId);
      localStorage.setItem(userKeys.adsCount, safeAdsCount.toString());
      localStorage.setItem(userKeys.revenueCount, safeRevenueCount.toString());
      localStorage.setItem(userKeys.lastUpdate, new Date().toISOString());
    }
    
    // Toujours mettre à jour les valeurs globales également
    localStorage.setItem(GLOBAL_STATS_KEYS.ADS_COUNT, safeAdsCount.toString());
    localStorage.setItem(GLOBAL_STATS_KEYS.REVENUE_COUNT, safeRevenueCount.toString());
    localStorage.setItem(GLOBAL_STATS_KEYS.LAST_UPDATE, new Date().toISOString());
  } catch (e) {
    console.error("Erreur lors de la sauvegarde des statistiques persistantes:", e);
  }
};

/**
 * Incrémente les compteurs de statistiques progressivement
 */
export const incrementPersistentStats = (
  adsIncrement: number,
  revenueIncrement: number,
  userId?: string
): { adsCount: number; revenueCount: number } => {
  const currentStats = getPersistentStats(userId);
  
  const newAdsCount = currentStats.adsCount + adsIncrement;
  const newRevenueCount = currentStats.revenueCount + revenueIncrement;
  
  savePersistentStats(newAdsCount, newRevenueCount, userId);
  
  return {
    adsCount: newAdsCount,
    revenueCount: newRevenueCount
  };
};

/**
 * Réinitialise les statistiques pour un utilisateur spécifique
 */
export const resetUserStats = (userId: string): void => {
  if (!userId) return;
  
  const userKeys = getUserStatsKeys(userId);
  localStorage.removeItem(userKeys.adsCount);
  localStorage.removeItem(userKeys.revenueCount);
  localStorage.removeItem(userKeys.lastUpdate);
};

/**
 * Synchronise les statistiques entre les sessions
 * Assure que les compteurs ne diminuent jamais
 */
export const syncPersistentStats = (
  serverAdsCount: number,
  serverRevenueCount: number,
  userId?: string
): { adsCount: number; revenueCount: number } => {
  const currentStats = getPersistentStats(userId);
  
  // Toujours prendre la valeur la plus élevée
  const syncedAdsCount = Math.max(currentStats.adsCount, serverAdsCount);
  const syncedRevenueCount = Math.max(currentStats.revenueCount, serverRevenueCount);
  
  savePersistentStats(syncedAdsCount, syncedRevenueCount, userId);
  
  return {
    adsCount: syncedAdsCount,
    revenueCount: syncedRevenueCount
  };
};
