
/**
 * Utilitaires de gestion du stockage local pour les statistiques et gains
 */

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
 * Sauvegarde les statistiques utilisateur
 */
export const saveUserStats = (stats: Record<string, any>): void => {
  try {
    localStorage.setItem('userStats', JSON.stringify(stats));
  } catch (e) {
    console.error("Error saving user stats:", e);
  }
};

/**
 * Récupère les statistiques utilisateur
 */
export const getUserStats = (): Record<string, any> => {
  try {
    const stored = localStorage.getItem('userStats');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Error reading user stats:", e);
    return {};
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
    
    // S'assurer que les valeurs ne sont pas inférieures aux cibles calculées
    adsCount = Math.max(adsCount, targetAdsCount);
    revenueCount = Math.max(revenueCount, targetRevenueCount);
    
    // Calculer la progression quotidienne
    const lastUpdate = parseInt(localStorage.getItem('stats_last_update') || '0', 10);
    const now = Date.now();
    const hoursSinceUpdate = Math.min(24, (now - lastUpdate) / (1000 * 60 * 60));
    
    if (hoursSinceUpdate > 1) {
      // Progression basée sur le temps écoulé
      const baseHourlyAdsGrowth = 15 + (daysSinceFirstUse * 2); // Croissance progressive
      const baseHourlyRevenueGrowth = 0.25 + (daysSinceFirstUse * 0.05); // Croissance progressive
      
      const adsIncrement = Math.round(hoursSinceUpdate * baseHourlyAdsGrowth);
      const revenueIncrement = parseFloat((hoursSinceUpdate * baseHourlyRevenueGrowth).toFixed(2));
      
      const updatedAds = adsCount + adsIncrement;
      const updatedRevenue = revenueCount + revenueIncrement;
      
      // Enregistrer les valeurs mises à jour
      localStorage.setItem('stats_ads_count', updatedAds.toString());
      localStorage.setItem('stats_revenue_count', updatedRevenue.toString());
      localStorage.setItem('stats_last_update', now.toString());
      
      return { 
        adsCount: updatedAds, 
        revenueCount: updatedRevenue, 
        hasStoredValues: true 
      };
    }
    
    return { adsCount, revenueCount, hasStoredValues: true };
  } catch (e) {
    console.error("Error loading stored values:", e);
    return { adsCount: 60000, revenueCount: 55000, hasStoredValues: false };
  }
};

/**
 * Enregistre les valeurs de statistiques
 */
export const saveValues = (adsCount: number, revenueCount: number, updateTimestamp = true): void => {
  try {
    localStorage.setItem('stats_ads_count', Math.round(adsCount).toString());
    localStorage.setItem('stats_revenue_count', revenueCount.toString());
    
    if (updateTimestamp) {
      localStorage.setItem('stats_last_update', Date.now().toString());
    }
  } catch (e) {
    console.error("Error saving values:", e);
  }
};

/**
 * Assure que les statistiques ne descendent pas en dessous des minimums
 */
export const enforceMinimumStats = (minAds: number, minRevenue: number): void => {
  try {
    // Récupérer la date de première utilisation
    const firstUseDate = localStorage.getItem('first_use_date') || new Date().toISOString();
    const daysSinceFirstUse = Math.max(1, Math.floor((new Date().getTime() - new Date(firstUseDate).getTime()) / (1000 * 3600 * 24)));
    
    // Ajuster les minimums en fonction du temps écoulé
    const adjustedMinAds = minAds * (1 + (daysSinceFirstUse / 30) * 0.4); // +40% par mois
    const adjustedMinRevenue = minRevenue * (1 + (daysSinceFirstUse / 30) * 0.35); // +35% par mois
    
    const currentAds = parseInt(localStorage.getItem('stats_ads_count') || '0');
    const currentRevenue = parseFloat(localStorage.getItem('stats_revenue_count') || '0');
    
    if (currentAds < adjustedMinAds || isNaN(currentAds)) {
      localStorage.setItem('stats_ads_count', Math.round(adjustedMinAds).toString());
    }
    
    if (currentRevenue < adjustedMinRevenue || isNaN(currentRevenue)) {
      localStorage.setItem('stats_revenue_count', adjustedMinRevenue.toString());
    }
  } catch (e) {
    console.error("Error enforcing minimum stats:", e);
  }
};

/**
 * Récupère des statistiques cohérentes avec la date actuelle
 */
export const getDateConsistentStats = (): { adsCount: number; revenueCount: number } => {
  try {
    // Récupérer la date de première utilisation ou définir la date actuelle
    const firstUseDate = localStorage.getItem('first_use_date') || new Date().toISOString();
    if (!localStorage.getItem('first_use_date')) {
      localStorage.setItem('first_use_date', firstUseDate);
    }
    
    // Calculer le nombre de jours écoulés depuis la première utilisation
    const daysSinceFirstUse = Math.max(1, Math.floor((new Date().getTime() - new Date(firstUseDate).getTime()) / (1000 * 3600 * 24)));
    
    // Définir les valeurs de base
    const baseAdsCount = 55000;
    const baseRevenueCount = 50000;
    
    // Calculer la progression en fonction du temps écoulé
    const monthlyGrowthFactor = 1.15; // +15% par mois
    const daysInMonth = 30;
    const monthsSinceStart = daysSinceFirstUse / daysInMonth;
    
    // Calculer les valeurs avec croissance exponentielle
    const growthMultiplier = Math.pow(monthlyGrowthFactor, monthsSinceStart);
    
    // Calculer les valeurs cibles
    const targetAdsCount = Math.floor(baseAdsCount * growthMultiplier * (1 + (daysSinceFirstUse * 0.03)));
    const targetRevenueCount = Math.floor(baseRevenueCount * growthMultiplier * (1 + (daysSinceFirstUse * 0.025)));
    
    // Vérifier si nous avons des valeurs stockées pour aujourd'hui
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('stats_storage_date');
    
    if (storedDate === today) {
      // Les valeurs sont cohérentes avec la date actuelle
      const storedAds = parseInt(localStorage.getItem('stats_ads_count') || '0');
      const storedRevenue = parseFloat(localStorage.getItem('stats_revenue_count') || '0');
      
      // Utiliser le maximum entre valeurs stockées et valeurs cibles
      const finalAdsCount = Math.max(storedAds, targetAdsCount);
      const finalRevenueCount = Math.max(storedRevenue, targetRevenueCount);
      
      // Enregistrer les valeurs ajustées
      localStorage.setItem('stats_ads_count', finalAdsCount.toString());
      localStorage.setItem('stats_revenue_count', finalRevenueCount.toString());
      
      return {
        adsCount: finalAdsCount,
        revenueCount: finalRevenueCount
      };
    }
    
    // Si les données sont d'une date différente, utiliser les valeurs cibles
    localStorage.setItem('stats_storage_date', today);
    localStorage.setItem('stats_ads_count', targetAdsCount.toString());
    localStorage.setItem('stats_revenue_count', targetRevenueCount.toString());
    
    return {
      adsCount: targetAdsCount,
      revenueCount: targetRevenueCount
    };
  } catch (e) {
    console.error("Error getting date consistent stats:", e);
    return {
      adsCount: 55000,
      revenueCount: 50000
    };
  }
};

/**
 * Incrémente les compteurs en fonction de la date
 */
export const incrementDateLinkedStats = (): { newAdsCount: number; newRevenueCount: number } => {
  try {
    const { adsCount, revenueCount } = loadStoredValues();
    
    // Récupérer la date de première utilisation
    const firstUseDate = localStorage.getItem('first_use_date') || new Date().toISOString();
    const daysSinceFirstUse = Math.max(1, Math.floor((new Date().getTime() - new Date(firstUseDate).getTime()) / (1000 * 3600 * 24)));
    
    // Facteurs d'incrémentation basés sur la durée d'utilisation
    const now = new Date();
    const baseIncrement = Math.max(20, Math.floor(daysSinceFirstUse / 4)); // Augmente avec le temps
    const hourFactor = (now.getHours() + 1) / 12; // Facteur entre 1/12 et 2
    const minuteFactor = now.getMinutes() / 30; // Facteur entre 0 et 2
    
    // Incrémentations dynamiques qui augmentent avec le temps
    const adsIncrement = Math.ceil(baseIncrement * hourFactor) + Math.ceil(minuteFactor * baseIncrement/2);
    const revenueIncrement = parseFloat((baseIncrement * 0.25 * hourFactor + minuteFactor * baseIncrement * 0.1).toFixed(2));
    
    const newAdsCount = adsCount + adsIncrement;
    const newRevenueCount = revenueCount + revenueIncrement;
    
    // Enregistrer les nouvelles valeurs
    localStorage.setItem('stats_ads_count', newAdsCount.toString());
    localStorage.setItem('stats_revenue_count', newRevenueCount.toString());
    localStorage.setItem('stats_last_update', Date.now().toString());
    
    return { newAdsCount, newRevenueCount };
  } catch (e) {
    console.error("Error incrementing stats:", e);
    
    // Récupérer les valeurs actuelles en cas d'erreur
    const { adsCount, revenueCount } = loadStoredValues();
    return { newAdsCount: adsCount, newRevenueCount: revenueCount };
  }
};
