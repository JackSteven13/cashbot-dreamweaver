
/**
 * Synchronise parfaitement les revenus avec le nombre de publicités
 * pour garantir une cohérence des données.
 */
export const synchronizeRevenueWithAds = (adsCount: number): number => {
  // Ce ratio fixe est utilisé dans tout le système pour garantir la cohérence
  const PERFECT_CORRELATION_RATIO = 0.76203;
  
  // Calcul du revenu avec précision à 2 décimales
  return Math.round(adsCount * PERFECT_CORRELATION_RATIO * 100) / 100;
};

/**
 * Calcule les revenus basés sur différentes localisations géographiques
 * pour simuler la diversité des taux de publicité
 */
export const calculateRevenueForLocation = (
  adsCount: number,
  location: string = 'global'
): number => {
  // Coefficients de base par région
  const locationFactors: Record<string, number> = {
    'us': 0.85,
    'eu': 0.78,
    'asia': 0.72,
    'global': 0.76203
  };
  
  // Utiliser le facteur de localisation ou le facteur global par défaut
  const factor = locationFactors[location.toLowerCase()] || locationFactors.global;
  
  // Calcul du revenu avec précision à 2 décimales
  return Math.round(adsCount * factor * 100) / 100;
};

/**
 * Calcule les statistiques globales à partir des valeurs centralisées
 * avec une évolution naturelle et réaliste au fil du temps
 */
export const getGlobalStats = async (): Promise<{adsCount: number, revenueCount: number}> => {
  try {
    // Valeurs de base stables
    const BASE_ADS_COUNT = 46800;
    const BASE_REVENUE_COUNT = synchronizeRevenueWithAds(BASE_ADS_COUNT);
    
    // Récupérer la dernière mise à jour des stats
    const lastStatsUpdateTime = parseInt(localStorage.getItem('stats_last_update_time') || '0', 10);
    const now = Date.now();
    
    // Obtenir le temps écoulé depuis la dernière mise à jour en minutes
    const minutesElapsed = Math.max(0, (now - lastStatsUpdateTime) / (1000 * 60));
    
    // Si c'est la première fois ou après un délai très long, initialiser avec les valeurs de base
    if (lastStatsUpdateTime === 0 || minutesElapsed > 120) {
      localStorage.setItem('stats_last_update_time', now.toString());
      
      return {
        adsCount: BASE_ADS_COUNT,
        revenueCount: BASE_REVENUE_COUNT
      };
    }
    
    // Calculer l'évolution naturelle basée sur le temps écoulé
    // Plus réaliste: progression variable au fil du temps
    
    // Calculer un montant d'incrément qui varie subtilement
    // entre 4 et 10 publicités par minute en moyenne
    const baseIncrement = 7; // publicités par minute en moyenne
    
    // Ajouter une variation aléatoire mais déterministe basée sur l'heure actuelle
    // pour que tout le monde voie les mêmes statistiques
    const hourOfDay = new Date().getHours();
    const dayFactor = Math.sin((hourOfDay / 24) * Math.PI) * 0.3 + 1; // facteur entre 0.7 et 1.3
    
    // Calculer l'incrément total depuis la dernière mise à jour
    const totalAdsIncrement = Math.floor(baseIncrement * minutesElapsed * dayFactor);
    
    // S'assurer que l'incrément n'est pas trop petit pour être crédible
    const minIncrement = minutesElapsed > 1 ? Math.ceil(minutesElapsed) * 2 : 0;
    const actualAdsIncrement = Math.max(totalAdsIncrement, minIncrement);
    
    // Calculer les nouvelles valeurs
    const newAdsCount = BASE_ADS_COUNT + actualAdsIncrement;
    const newRevenueCount = synchronizeRevenueWithAds(newAdsCount);
    
    // Enregistrer le moment de cette mise à jour
    localStorage.setItem('stats_last_update_time', now.toString());
    
    return {
      adsCount: newAdsCount,
      revenueCount: newRevenueCount
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques globales", error);
    // Valeurs par défaut en cas d'erreur
    return {
      adsCount: 46800,
      revenueCount: synchronizeRevenueWithAds(46800)
    };
  }
};

/**
 * Génère une petite variation dans les statistiques pour donner
 * l'impression d'un système vivant sans changements trop brusques
 */
export const getSmallStatsVariation = (): {adsCount: number, revenueCount: number} => {
  // Obtenir les statistiques actuelles
  const lastUpdateStr = localStorage.getItem('stats_last_small_variation') || '0';
  const lastUpdate = parseInt(lastUpdateStr, 10);
  const now = Date.now();
  
  // Si dernière mise à jour récente, ne pas modifier les valeurs
  if (now - lastUpdate < 8000) {
    const currentAdsStr = localStorage.getItem('current_ads_count');
    const currentRevenueStr = localStorage.getItem('current_revenue_count');
    
    if (currentAdsStr && currentRevenueStr) {
      return {
        adsCount: parseFloat(currentAdsStr),
        revenueCount: parseFloat(currentRevenueStr)
      };
    }
  }
  
  // Générer une petite variation aléatoire (entre 0 et 2 publicités)
  const variationAmount = Math.floor(Math.random() * 3);
  
  // Récupérer la base actuelle ou utiliser une valeur par défaut
  const baseAdsCount = parseInt(localStorage.getItem('current_ads_count') || '46800', 10);
  
  // Appliquer la variation
  const newAdsCount = baseAdsCount + variationAmount;
  const newRevenueCount = synchronizeRevenueWithAds(newAdsCount);
  
  // Stocker les nouvelles valeurs
  localStorage.setItem('current_ads_count', newAdsCount.toString());
  localStorage.setItem('current_revenue_count', newRevenueCount.toString());
  localStorage.setItem('stats_last_small_variation', now.toString());
  
  return {
    adsCount: newAdsCount,
    revenueCount: newRevenueCount
  };
};
