
import { getPersistentStats, savePersistentStats } from './persistentStats';

/**
 * Synchronise les statistiques entre les différents composants
 * avec un focus sur la parfaite synchronisation des revenus
 */
export const initStatsSync = (userId?: string): (() => void) => {
  // Événement pour synchroniser les statistiques lors du chargement initial
  window.dispatchEvent(new CustomEvent('stats:init'));
  
  // Définir le ratio constant pour garantir la synchronisation parfaite
  const PERFECT_CORRELATION_RATIO = 0.76203;
  
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
    
    // FORCER la parfaite corrélation entre pubs et revenus
    const correctRevenueCount = stats.adsCount * PERFECT_CORRELATION_RATIO;
    
    // Si les revenus ne sont pas en parfaite corrélation, les forcer
    if (Math.abs(stats.revenueCount - correctRevenueCount) > 0.01) {
      console.log(`Forçage de la corrélation parfaite. Revenus: ${stats.revenueCount} -> ${correctRevenueCount}`);
      stats.revenueCount = correctRevenueCount;
      
      // Sauvegarder les statistiques corrigées
      savePersistentStats(stats.adsCount, correctRevenueCount, userId);
    }
    
    // Déclencher un événement pour mettre à jour tous les composants
    window.dispatchEvent(new CustomEvent('stats:sync', {
      detail: stats
    }));
    
  }, 200); // Synchroniser très fréquemment pour une réactivité immédiate
  
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
 * Force la synchronisation des statistiques avec un ratio parfait
 * entre publicités et revenus
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
  
  // TOUJOURS calculer les revenus en fonction des publicités avec un ratio fixe
  const PERFECT_CORRELATION_RATIO = 0.76203;
  const syncedRevenueCount = syncedAdsCount * PERFECT_CORRELATION_RATIO;
  
  // Persister les valeurs synchronisées et parfaitement corrélées
  savePersistentStats(syncedAdsCount, syncedRevenueCount, userId);
  
  // Informer les autres composants de la mise à jour
  window.dispatchEvent(new CustomEvent('stats:update', {
    detail: {
      adsCount: syncedAdsCount,
      revenueCount: syncedRevenueCount
    }
  }));
  
  return {
    adsCount: syncedAdsCount,
    revenueCount: syncedRevenueCount
  };
};
