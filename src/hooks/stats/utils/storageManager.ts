
// Storage keys as constants
export const STORAGE_KEYS = {
  GLOBAL_ADS_COUNT: 'global_ads_count',
  GLOBAL_REVENUE_COUNT: 'global_revenue_count',
  ADS_COUNT: 'stats_ads_count',
  REVENUE_COUNT: 'stats_revenue_count',
  LAST_UPDATE: 'stats_last_update',
  RESET_DATE: 'stats_reset_date',
  DISPLAYED_ADS: 'displayed_ads_count',
  DISPLAYED_REVENUE: 'displayed_revenue_count',
  DATE_LINKED_STATS: 'date_linked_stats',
  LANDING_PAGE_STATS: 'landing_page_stats'
};

// Minimum baseline values for landing page that should never be dropped below
const MINIMUM_ADS_COUNT = 40000;
const MINIMUM_REVENUE_COUNT = 50000;

// Fonction pour générer une valeur de base cohérente liée à la date pour la landing page
export const generateDateBasedValues = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const monthFactor = (today.getMonth() + 1) * 1000; // Facteur lié au mois
  
  // Base constante qui augmente progressivement chaque jour de l'année - Pour la landing page uniquement
  const baseAdsCount = MINIMUM_ADS_COUNT + (dayOfYear * 250) + monthFactor;
  const baseRevenueCount = MINIMUM_REVENUE_COUNT + (dayOfYear * 350) + monthFactor;
  
  // Ajouter une composante horaire pour une progression au cours de la journée
  const hourFactor = today.getHours() * 120; // Plus d'activité au fil de la journée
  
  return {
    adsCount: Math.round(baseAdsCount + hourFactor),
    revenueCount: Math.round(baseRevenueCount + hourFactor * 1.2)
  };
};

// Nouvelle fonction pour gérer les stats utilisateur avec respect des limites quotidiennes
export const loadUserStats = (subscription = 'freemium') => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Charger les stats de l'utilisateur pour aujourd'hui
    const userStats = localStorage.getItem(`user_stats_${today}`);
    if (userStats) {
      const stats = JSON.parse(userStats);
      return {
        currentGains: Math.min(stats.gains || 0, dailyLimit),
        sessionCount: stats.sessions || 0,
        lastUpdate: stats.lastUpdate || Date.now()
      };
    }
    
    // Initialiser de nouvelles stats pour aujourd'hui
    return {
      currentGains: 0,
      sessionCount: 0,
      lastUpdate: Date.now()
    };
  } catch (e) {
    console.error("Error loading user stats:", e);
    return {
      currentGains: 0,
      sessionCount: 0,
      lastUpdate: Date.now()
    };
  }
};

// Pour les stats de la landing page
export const loadStoredValues = () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Vérifier si nous avons des statistiques globales pour la landing page
    const landingPageStats = localStorage.getItem(STORAGE_KEYS.LANDING_PAGE_STATS);
    const storedDate = landingPageStats ? JSON.parse(landingPageStats).date : null;
    
    if (storedDate === today) {
      const storedStats = JSON.parse(landingPageStats);
      return {
        hasStoredValues: true,
        adsCount: Math.max(MINIMUM_ADS_COUNT, storedStats.adsCount),
        revenueCount: Math.max(MINIMUM_REVENUE_COUNT, storedStats.revenueCount),
        lastUpdate: Date.now()
      };
    }
    
    // Générer de nouvelles valeurs pour la landing page
    const dateBasedValues = generateDateBasedValues();
    
    // Sauvegarder les nouvelles valeurs
    localStorage.setItem(STORAGE_KEYS.LANDING_PAGE_STATS, JSON.stringify({
      date: today,
      adsCount: dateBasedValues.adsCount,
      revenueCount: dateBasedValues.revenueCount,
      generatedAt: Date.now()
    }));
    
    return {
      hasStoredValues: true,
      adsCount: dateBasedValues.adsCount,
      revenueCount: dateBasedValues.revenueCount,
      lastUpdate: Date.now()
    };
  } catch (e) {
    console.error("Error loading stored values:", e);
    const dateBasedValues = generateDateBasedValues();
    return {
      hasStoredValues: true,
      adsCount: dateBasedValues.adsCount,
      revenueCount: dateBasedValues.revenueCount,
      lastUpdate: Date.now()
    };
  }
};

// Pour les stats de l'utilisateur
export const saveUserStats = (gains: number, sessions: number) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`user_stats_${today}`, JSON.stringify({
      gains,
      sessions,
      lastUpdate: Date.now()
    }));
  } catch (e) {
    console.error("Error saving user stats:", e);
  }
};
