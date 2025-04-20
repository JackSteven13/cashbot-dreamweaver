
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
    const adsCountStr = localStorage.getItem('stats_ads_count');
    const revenueCountStr = localStorage.getItem('stats_revenue_count');
    const adsCount = adsCountStr ? parseInt(adsCountStr) : 0;
    const revenueCount = revenueCountStr ? parseFloat(revenueCountStr) : 0;
    
    // Vérifier si nous avons des valeurs stockées valides
    const hasStoredValues = adsCount > 0 && revenueCount > 0;
    
    // Progression basée sur le temps écoulé depuis la dernière mise à jour
    if (hasStoredValues) {
      const lastUpdate = parseInt(localStorage.getItem('stats_last_update') || Date.now().toString(), 10);
      const now = Date.now();
      const hoursSinceUpdate = Math.min(24, (now - lastUpdate) / (1000 * 60 * 60));
      
      if (hoursSinceUpdate > 1) {
        // Progression très lente basée sur le temps écoulé
        const adsIncrement = Math.round(hoursSinceUpdate * 15); // ~15 ads par heure
        const revenueIncrement = parseFloat((hoursSinceUpdate * 0.25).toFixed(2)); // ~0.25€ par heure
        
        const updatedAds = adsCount + adsIncrement;
        const updatedRevenue = revenueCount + revenueIncrement;
        
        // Enregistrer les valeurs mises à jour
        localStorage.setItem('stats_ads_count', updatedAds.toString());
        localStorage.setItem('stats_revenue_count', updatedRevenue.toString());
        localStorage.setItem('stats_last_update', now.toString());
        
        console.log("Using stored values:", { 
          adsCount: updatedAds, 
          revenueCount: updatedRevenue, 
          hasStoredValues: true 
        });
        
        return { 
          adsCount: updatedAds, 
          revenueCount: updatedRevenue, 
          hasStoredValues: true 
        };
      }
      
      console.log("Using stored values:", { 
        adsCount, 
        revenueCount, 
        hasStoredValues: true 
      });
      
      return { adsCount, revenueCount, hasStoredValues: true };
    }
    
    return { adsCount: 0, revenueCount: 0, hasStoredValues: false };
  } catch (e) {
    console.error("Error loading stored values:", e);
    return { adsCount: 0, revenueCount: 0, hasStoredValues: false };
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
    const currentAds = parseInt(localStorage.getItem('stats_ads_count') || '0');
    const currentRevenue = parseFloat(localStorage.getItem('stats_revenue_count') || '0');
    
    if (currentAds < minAds || isNaN(currentAds)) {
      localStorage.setItem('stats_ads_count', minAds.toString());
    }
    
    if (currentRevenue < minRevenue || isNaN(currentRevenue)) {
      localStorage.setItem('stats_revenue_count', minRevenue.toString());
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
    // Vérifier si nous avons des valeurs stockées pour aujourd'hui
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('stats_storage_date');
    
    if (storedDate === today) {
      // Les valeurs sont cohérentes avec la date actuelle
      const storedValues = loadStoredValues();
      return {
        adsCount: storedValues.adsCount,
        revenueCount: storedValues.revenueCount
      };
    }
    
    // Si les données sont d'une date différente, appliquer une progression minimale
    const storedValues = loadStoredValues();
    const baseAdsCount = Math.max(40000, storedValues.adsCount);
    const baseRevenueCount = Math.max(50000, storedValues.revenueCount);
    
    // Enregistrer la date actuelle et les valeurs ajustées
    localStorage.setItem('stats_storage_date', today);
    localStorage.setItem('stats_ads_count', baseAdsCount.toString());
    localStorage.setItem('stats_revenue_count', baseRevenueCount.toString());
    
    return {
      adsCount: baseAdsCount,
      revenueCount: baseRevenueCount
    };
  } catch (e) {
    console.error("Error getting date consistent stats:", e);
    return {
      adsCount: 40000,
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
    
    // Petite incrémentation basée sur l'heure actuelle
    const now = new Date();
    const hourFactor = (now.getHours() + 1) / 24; // Facteur entre 1/24 et 1
    const minuteFactor = now.getMinutes() / 60; // Facteur entre 0 et 1
    
    const adsIncrement = Math.ceil(hourFactor * 100) + Math.ceil(minuteFactor * 50);
    const revenueIncrement = parseFloat((hourFactor * 5 + minuteFactor * 2).toFixed(2));
    
    const newAdsCount = adsCount + adsIncrement;
    const newRevenueCount = revenueCount + revenueIncrement;
    
    // Enregistrer les nouvelles valeurs
    localStorage.setItem('stats_ads_count', newAdsCount.toString());
    localStorage.setItem('stats_revenue_count', newRevenueCount.toString());
    localStorage.setItem('stats_last_update', Date.now().toString());
    
    console.log("Auto-incrément des statistiques");
    
    return { newAdsCount, newRevenueCount };
  } catch (e) {
    console.error("Error incrementing stats:", e);
    
    // Récupérer les valeurs actuelles en cas d'erreur
    const { adsCount, revenueCount } = loadStoredValues();
    return { newAdsCount: adsCount, newRevenueCount: revenueCount };
  }
};
