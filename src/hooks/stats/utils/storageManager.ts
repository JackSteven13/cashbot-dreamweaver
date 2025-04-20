
/**
 * Utilitaires de gestion du stockage local pour les statistiques et gains
 */

interface UserStatsType {
  currentGains: number;
  sessionCount: number;
  [key: string]: any;
}

/**
 * Ajoute un gain au total quotidien
 */
export const addDailyGain = (gain: number): void => {
  if (isNaN(gain) || gain <= 0) return;
  
  const current = getDailyGains();
  const newTotal = parseFloat((current + gain).toFixed(2));
  
  localStorage.setItem('dailyGains', newTotal.toString());
  
  // Déclencher un événement pour informer les autres composants
  window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
    detail: { amount: newTotal } 
  }));
};

/**
 * Récupère le total des gains quotidiens
 */
export const getDailyGains = (subscription = 'freemium'): number => {
  try {
    const stored = localStorage.getItem('dailyGains');
    return stored ? parseFloat(stored) : 0;
  } catch (e) {
    console.error("Error reading daily gains:", e);
    return 0;
  }
};

/**
 * Réinitialise les gains quotidiens
 */
export const resetDailyGains = (): void => {
  localStorage.setItem('dailyGains', '0');
  
  // Déclencher un événement pour informer les autres composants
  window.dispatchEvent(new CustomEvent('dailyGains:reset'));
};

/**
 * Charge les statistiques utilisateur
 */
export const loadUserStats = (subscription = 'freemium'): UserStatsType => {
  try {
    const stored = localStorage.getItem('userStats');
    if (stored) {
      const stats = JSON.parse(stored);
      return {
        currentGains: stats.currentGains || 0,
        sessionCount: stats.sessionCount || 0,
        ...stats
      };
    }
    return { currentGains: 0, sessionCount: 0 };
  } catch (e) {
    console.error("Error loading user stats:", e);
    return { currentGains: 0, sessionCount: 0 };
  }
};

/**
 * Sauvegarde les statistiques utilisateur
 */
export const saveUserStats = (stats: UserStatsType | number, sessionCount?: number): void => {
  try {
    let dataToSave: UserStatsType;
    
    // Gestion des deux formats d'appel
    if (typeof stats === 'number' && typeof sessionCount === 'number') {
      dataToSave = {
        currentGains: stats,
        sessionCount: sessionCount
      };
    } else if (typeof stats === 'object') {
      dataToSave = stats;
    } else {
      console.error("Invalid parameters for saveUserStats");
      return;
    }
    
    localStorage.setItem('userStats', JSON.stringify(dataToSave));
  } catch (e) {
    console.error("Error saving user stats:", e);
  }
};

/**
 * Charge les valeurs stockées avec progression temporelle
 */
export const loadStoredValues = (): { adsCount: number; revenueCount: number; hasStoredValues: boolean } => {
  try {
    // Récupérer la date de première utilisation ou définir la date actuelle
    const firstUseDate = localStorage.getItem('first_use_date') || new Date().toISOString();
    if (!localStorage.getItem('first_use_date')) {
      localStorage.setItem('first_use_date', firstUseDate);
    }
    
    // Calculer le nombre de jours écoulés depuis la première utilisation
    const daysSinceFirstUse = Math.max(1, Math.floor((new Date().getTime() - new Date(firstUseDate).getTime()) / (1000 * 3600 * 24)));
    
    // Récupérer les valeurs stockées
    const adsCountStr = localStorage.getItem('stats_ads_count');
    const revenueCountStr = localStorage.getItem('stats_revenue_count');
    
    // Définir les valeurs de base
    let baseAdsCount = 56500; // Valeur minimale de départ
    let baseRevenueCount = 51800; // Valeur minimale de départ
    
    // Calculer la progression en fonction du temps écoulé
    const monthlyGrowthFactor = 1.15; // +15% par mois
    const daysInMonth = 30;
    const monthsSinceStart = daysSinceFirstUse / daysInMonth;
    
    // Calculer les valeurs avec croissance exponentielle
    const growthMultiplier = Math.pow(monthlyGrowthFactor, monthsSinceStart);
    
    // Calculer les valeurs cibles en fonction du temps écoulé (croissance plus agressive)
    const targetAdsCount = Math.floor(baseAdsCount * growthMultiplier * Math.sqrt(daysSinceFirstUse * 1.5));
    const targetRevenueCount = Math.floor(baseRevenueCount * growthMultiplier * Math.sqrt(daysSinceFirstUse * 1.2));
    
    // Si nous avons des valeurs stockées, les utiliser comme base, sinon utiliser les valeurs calculées
    let adsCount = adsCountStr ? parseInt(adsCountStr) : targetAdsCount;
    let revenueCount = revenueCountStr ? parseFloat(revenueCountStr) : targetRevenueCount;
    
    // Mettre à jour les valeurs si elles sont trop basses par rapport aux valeurs calculées
    if (adsCount < targetAdsCount * 0.9) {
      adsCount = targetAdsCount;
    }
    
    if (revenueCount < targetRevenueCount * 0.9) {
      revenueCount = targetRevenueCount;
    }
    
    // Enregistrer les nouvelles valeurs
    localStorage.setItem('stats_ads_count', adsCount.toString());
    localStorage.setItem('stats_revenue_count', revenueCount.toString());
    
    console.log("Using stored values:", { adsCount, revenueCount, hasStoredValues: true });
    
    return {
      adsCount,
      revenueCount,
      hasStoredValues: true
    };
  } catch (e) {
    console.error("Error loading stored values:", e);
    return {
      adsCount: 60000,
      revenueCount: 55000,
      hasStoredValues: false
    };
  }
};
