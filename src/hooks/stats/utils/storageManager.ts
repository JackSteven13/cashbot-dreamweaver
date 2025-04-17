
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
  DATE_LINKED_STATS: 'date_linked_stats'
};

// Minimum baseline values that should never be dropped below
const MINIMUM_ADS_COUNT = 40000;
const MINIMUM_REVENUE_COUNT = 50000;

// Fonction pour générer une valeur de base cohérente liée à la date
export const generateDateBasedValues = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const monthFactor = (today.getMonth() + 1) * 1000; // Facteur lié au mois
  
  // Base constante qui augmente progressivement chaque jour de l'année
  const baseAdsCount = MINIMUM_ADS_COUNT + (dayOfYear * 250) + monthFactor;
  const baseRevenueCount = MINIMUM_REVENUE_COUNT + (dayOfYear * 350) + monthFactor;
  
  // Ajouter une composante horaire pour une progression au cours de la journée
  const hourFactor = today.getHours() * 120; // Plus d'activité au fil de la journée
  
  return {
    adsCount: Math.round(baseAdsCount + hourFactor),
    revenueCount: Math.round(baseRevenueCount + hourFactor * 1.2)
  };
};

export const loadStoredValues = () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Vérifier si nous avons des statistiques liées à la date d'aujourd'hui
    const dateLinkedStats = localStorage.getItem(STORAGE_KEYS.DATE_LINKED_STATS);
    const storedDate = dateLinkedStats ? JSON.parse(dateLinkedStats).date : null;
    
    // Si nous avons des stats pour aujourd'hui, les utiliser
    if (storedDate === today) {
      const storedStats = JSON.parse(dateLinkedStats);
      console.log(`Chargement des statistiques liées à aujourd'hui (${today})`, storedStats);
      
      return {
        hasStoredValues: true,
        adsCount: Math.max(MINIMUM_ADS_COUNT, storedStats.adsCount),
        revenueCount: Math.max(MINIMUM_REVENUE_COUNT, storedStats.revenueCount),
        lastUpdate: Date.now()
      };
    }
    
    // Si nous n'avons pas de stats pour aujourd'hui, générer des valeurs basées sur la date
    const dateBasedValues = generateDateBasedValues();
    console.log(`Génération de nouvelles statistiques basées sur la date (${today})`, dateBasedValues);
    
    // Sauvegarder immédiatement ces valeurs pour assurer la cohérence
    saveValues(dateBasedValues.adsCount, dateBasedValues.revenueCount);
    
    // Stocker spécifiquement les valeurs liées à la date
    localStorage.setItem(STORAGE_KEYS.DATE_LINKED_STATS, JSON.stringify({
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
    
    // En cas d'erreur, utiliser des valeurs par défaut
    const dateBasedValues = generateDateBasedValues();
    
    return {
      hasStoredValues: true,
      adsCount: dateBasedValues.adsCount,
      revenueCount: dateBasedValues.revenueCount,
      lastUpdate: Date.now()
    };
  }
};

export const saveValues = (ads: number, revenue: number) => {
  try {
    // Protection pour éviter les valeurs négatives ou trop basses
    const safeAdsCount = Math.max(MINIMUM_ADS_COUNT, Math.round(ads));
    const safeRevenueCount = Math.max(MINIMUM_REVENUE_COUNT, Math.round(revenue));
    
    // Sauvegarder à la fois comme valeurs globales et spécifiques à l'utilisateur
    localStorage.setItem(STORAGE_KEYS.GLOBAL_ADS_COUNT, safeAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.GLOBAL_REVENUE_COUNT, safeRevenueCount.toString());
    
    localStorage.setItem(STORAGE_KEYS.ADS_COUNT, safeAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.REVENUE_COUNT, safeRevenueCount.toString());
    
    // Aussi sauvegarder comme valeurs affichées pour une cohérence immédiate
    localStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS, safeAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE, safeRevenueCount.toString());
    
    // Utiliser sessionStorage pour la persistance à travers les actualisations de page
    sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS, safeAdsCount.toString());
    sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE, safeRevenueCount.toString());
    
    // Mettre à jour les statistiques liées à la date
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.DATE_LINKED_STATS, JSON.stringify({
      date: today,
      adsCount: safeAdsCount,
      revenueCount: safeRevenueCount,
      updatedAt: Date.now()
    }));
    
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.RESET_DATE, new Date().toDateString());
  } catch (e) {
    console.error("Error saving values to localStorage:", e);
  }
};

// Nouvelle fonction pour synchroniser les valeurs en augmentant progressivement
export const incrementDateLinkedStats = () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dateLinkedStats = localStorage.getItem(STORAGE_KEYS.DATE_LINKED_STATS);
    
    if (dateLinkedStats) {
      const stats = JSON.parse(dateLinkedStats);
      
      // Si les stats sont pour aujourd'hui, les augmenter légèrement
      if (stats.date === today) {
        // Augmentation progressive basée sur l'heure
        const currentHour = new Date().getHours();
        const hourFactor = Math.max(1, currentHour * 0.8); // Plus d'activité plus tard dans la journée
        
        // Augmentation progressive (plus intense aux heures de pointe)
        const adsIncrement = Math.round(Math.random() * 50 * hourFactor) + 10;
        const revenueIncrement = Math.round(Math.random() * 70 * hourFactor) + 15;
        
        const newAdsCount = stats.adsCount + adsIncrement;
        const newRevenueCount = stats.revenueCount + revenueIncrement;
        
        // Sauvegarder les valeurs mises à jour
        saveValues(newAdsCount, newRevenueCount);
        
        return {
          adsCount: newAdsCount,
          revenueCount: newRevenueCount
        };
      }
    }
    
    // Si pas de stats pour aujourd'hui, initialiser avec des valeurs basées sur la date
    const dateBasedValues = generateDateBasedValues();
    saveValues(dateBasedValues.adsCount, dateBasedValues.revenueCount);
    
    return dateBasedValues;
  } catch (e) {
    console.error("Error incrementing date-linked stats:", e);
    return generateDateBasedValues();
  }
};
