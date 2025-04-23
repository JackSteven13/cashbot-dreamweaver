
/**
 * Utilitaire pour gérer les statistiques persistantes (compteurs de publicités et de revenus)
 */

interface PersistentStats {
  adsCount: number;
  revenueCount: number;
}

// Clés de stockage qui incluent l'ID utilisateur pour l'isolation des données
const STORAGE_KEYS = {
  globalAdsCount: 'global_stats_ads_count',
  globalRevenueCount: 'global_stats_revenue_count',
  userAdsCount: (userId: string) => `stats_ads_count_${userId}`,
  userRevenueCount: (userId: string) => `stats_revenue_count_${userId}`,
  // Ajouter une clé pour la dernière visite utilisateur pour avoir un comportement différent pour chaque utilisateur
  lastVisit: (userId: string) => `stats_last_visit_${userId}`
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
      
      // Si pas de données pour cet utilisateur, initialiser avec des valeurs aléatoires spécifiques
      // basées sur l'ID utilisateur pour que chaque utilisateur ait ses propres chiffres
      if (userId) {
        // Utiliser l'ID pour générer un "seed" qui donne des chiffres cohérents mais différents par utilisateur
        const charSum = Array.from(userId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const seedValue = (charSum % 1000) + 1000; // Valeur entre 1000 et 2000
        
        const baseAds = 1000 + seedValue;
        const baseRevenue = baseAds * 0.76203; // Maintenir le ratio constant
        
        // Sauvegarder ces valeurs pour les prochaines visites
        localStorage.setItem(STORAGE_KEYS.userAdsCount(userId), baseAds.toString());
        localStorage.setItem(STORAGE_KEYS.userRevenueCount(userId), baseRevenue.toString());
        
        // Enregistrer la première visite
        localStorage.setItem(STORAGE_KEYS.lastVisit(userId), Date.now().toString());
        
        return {
          adsCount: baseAds,
          revenueCount: baseRevenue
        };
      }
    }
    
    // Sinon, récupérer les statistiques globales
    const globalAdsCount = localStorage.getItem(STORAGE_KEYS.globalAdsCount);
    const globalRevenueCount = localStorage.getItem(STORAGE_KEYS.globalRevenueCount);
    
    // Utiliser des valeurs aléatoires spécifiques à la session en cours pour les utilisateurs anonymes
    const sessionSeed = parseInt(sessionStorage.getItem('anonymous_stats_seed') || '0');
    if (!sessionSeed) {
      const newSeed = 1000 + Math.floor(Math.random() * 2000);
      sessionStorage.setItem('anonymous_stats_seed', newSeed.toString());
    }
    
    return {
      adsCount: globalAdsCount ? parseFloat(globalAdsCount) : (sessionSeed || 1000 + Math.floor(Math.random() * 2000)),
      revenueCount: globalRevenueCount ? parseFloat(globalRevenueCount) : (sessionSeed * 0.76203 || (500 + Math.floor(Math.random() * 1000)))
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    
    // En cas d'erreur, retourner des valeurs par défaut
    const fallbackSeed = Math.floor(Math.random() * 1000) + 1000;
    return {
      adsCount: fallbackSeed,
      revenueCount: fallbackSeed * 0.76203
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
      
      // Mettre à jour la date de dernière visite
      localStorage.setItem(STORAGE_KEYS.lastVisit(userId), Date.now().toString());
    } else {
      // Pour les utilisateurs anonymes, stocker également dans la session
      const sessionSeed = parseInt(sessionStorage.getItem('anonymous_stats_seed') || '0');
      if (!sessionSeed) {
        sessionStorage.setItem('anonymous_stats_seed', Math.floor(safeAdsCount).toString());
      }
    }
    
    // Ne pas mettre à jour les statistiques globales pour isoler les données des utilisateurs
    // Nous n'utiliserons plus les statistiques globales à partir de maintenant
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
