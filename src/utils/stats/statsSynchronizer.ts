
import { getPersistentStats, savePersistentStats } from './persistentStats';

/**
 * Synchronise les statistiques entre les différents composants
 * avec un focus sur la parfaite synchronisation des revenus
 */
export const initStatsSync = (userId?: string): (() => void) => {
  // Événement pour synchroniser les statistiques lors du chargement initial
  window.dispatchEvent(new CustomEvent('stats:init'));
  
  // Écouter les événements de stockage depuis d'autres onglets
  const handleStorageChange = (e: StorageEvent) => {
    if (!e.key) return;
    
    // Détecter les changements liés aux statistiques
    if (e.key.includes('stats_') || e.key.includes('global_stats_')) {
      // Récupérer les dernières statistiques
      const latestStats = getPersistentStats(userId);
      
      // Informer les autres composants du changement
      window.dispatchEvent(new CustomEvent('stats:update', {
        detail: latestStats
      }));
    }
  };
  
  // Écouter les changements de stockage dans d'autres onglets
  window.addEventListener('storage', handleStorageChange);
  
  // Synchroniser les compteurs très fréquemment avec forte corrélation
  const syncInterval = setInterval(() => {
    const stats = getPersistentStats(userId);
    
    // Déclencher un événement pour mettre à jour tous les composants
    window.dispatchEvent(new CustomEvent('stats:sync', {
      detail: stats
    }));
    
    // Forcer la persistance périodiquement pour éviter les désynchronisations
    savePersistentStats(stats.adsCount, stats.revenueCount, userId);
  }, 500); // Synchroniser très fréquemment pour une réactivité immédiate
  
  // Nettoyer lors de la déconnexion ou du déchargement de la page
  const cleanup = () => {
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(syncInterval);
  };
  
  // Nettoyer lors du déchargement de la page
  window.addEventListener('beforeunload', cleanup);
  
  // Retourner une fonction de nettoyage pour l'utilisation dans useEffect
  return cleanup;
};

/**
 * Charge les statistiques depuis le serveur et les synchronise avec les valeurs locales
 * en garantissant la corrélation entre publicités et revenus
 */
export const syncStatsWithServer = async (
  serverStats: { adsCount?: number; revenueCount?: number },
  userId?: string
): Promise<{ adsCount: number; revenueCount: number }> => {
  // Récupérer les statistiques locales
  const localStats = getPersistentStats(userId);
  
  // Utiliser les valeurs du serveur seulement si elles sont valides
  const serverAdsCount = typeof serverStats.adsCount === 'number' && !isNaN(serverStats.adsCount) 
    ? serverStats.adsCount 
    : 0;
    
  const serverRevenueCount = typeof serverStats.revenueCount === 'number' && !isNaN(serverStats.revenueCount) 
    ? serverStats.revenueCount 
    : 0;
  
  // Toujours prendre la valeur la plus élevée entre locale et serveur
  const syncedAdsCount = Math.max(localStats.adsCount, serverAdsCount);
  const syncedRevenueCount = Math.max(localStats.revenueCount, serverRevenueCount);
  
  // Si le ratio publicités/revenus est trop faible, ajuster les revenus pour maintenir la corrélation
  const expectedRatio = 0.76; // Ratio attendu revenus/publicités
  const currentRatio = syncedRevenueCount / syncedAdsCount;
  
  // Si le ratio actuel est trop faible, augmenter les revenus pour maintenir la corrélation
  let finalRevenueCount = syncedRevenueCount;
  if (currentRatio < expectedRatio) {
    finalRevenueCount = syncedAdsCount * expectedRatio;
  }
  
  // Persister les valeurs synchronisées et corrélées
  savePersistentStats(syncedAdsCount, finalRevenueCount, userId);
  
  // Informer les autres composants de la mise à jour
  window.dispatchEvent(new CustomEvent('stats:update', {
    detail: {
      adsCount: syncedAdsCount,
      revenueCount: finalRevenueCount
    }
  }));
  
  return {
    adsCount: syncedAdsCount,
    revenueCount: finalRevenueCount
  };
};
