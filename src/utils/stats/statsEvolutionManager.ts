
/**
 * Module pour gérer l'évolution des statistiques au fil du temps
 * Assure une croissance crédible des compteurs entre les sessions
 */

// Dates clés pour mesurer l'évolution du temps
const START_DATE = new Date('2024-01-01');
const STATS_EVOLUTION_KEY = 'stats_evolution_data';

interface StatsEvolutionData {
  lastUpdateTime: number;
  baseAdsCount: number;
  baseRevenueCount: number;
  growthRate: number;
  dailyAdsIncrease: number;
  dailyRevenueIncrease: number;
  correlationRatio: number; // Pour maintenir la cohérence entre publicités et revenus
}

/**
 * Initialise les données d'évolution si nécessaire ou les récupère du stockage local
 */
export const initializeEvolutionData = (): StatsEvolutionData => {
  // Essayer de récupérer les données existantes
  const storedData = localStorage.getItem(STATS_EVOLUTION_KEY);
  
  if (storedData) {
    try {
      return JSON.parse(storedData) as StatsEvolutionData;
    } catch (e) {
      console.error('Erreur lors du parsing des données d\'évolution:', e);
      // Continuer pour régénérer les données
    }
  }
  
  // Générer de nouvelles données d'évolution
  const now = Date.now();
  const daysSinceStart = Math.max(1, Math.floor((now - START_DATE.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Valeurs de base avec légère variation aléatoire (±5%)
  const baseVariation = 0.95 + (Math.random() * 0.1);
  const correlationRatio = 0.75 + (Math.random() * 0.1); // Approximativement 0.75-0.85€ par pub
  const baseAdsCount = Math.floor(35000 * baseVariation);
  
  const newData: StatsEvolutionData = {
    lastUpdateTime: now,
    baseAdsCount: baseAdsCount,
    // Calculer revenus en fonction des publicités (avec petit bruit pour plus de réalisme)
    baseRevenueCount: Math.floor(baseAdsCount * correlationRatio * baseVariation),
    growthRate: 0.008 + (Math.random() * 0.004), // 0.8% à 1.2% par jour
    dailyAdsIncrease: Math.floor(150 + (Math.random() * 100)), // 150-250 par jour
    dailyRevenueIncrease: Math.floor(120 + (Math.random() * 80)), // 120-200 par jour
    correlationRatio: correlationRatio
  };
  
  // Sauvegarder les données
  persistEvolutionData(newData);
  
  return newData;
};

/**
 * Calcule les valeurs actuelles des compteurs en fonction du temps écoulé
 * @returns Objet avec les valeurs calculées des compteurs
 */
export const calculateCurrentCounters = (): { adsCount: number; revenueCount: number } => {
  const evolutionData = initializeEvolutionData();
  const now = Date.now();
  
  // Calculer le temps écoulé depuis la dernière mise à jour
  const daysSinceUpdate = (now - evolutionData.lastUpdateTime) / (1000 * 60 * 60 * 24);
  
  // Si moins d'une heure s'est écoulée, utiliser les valeurs de base
  if (daysSinceUpdate < 0.04) {
    return {
      adsCount: evolutionData.baseAdsCount,
      revenueCount: evolutionData.baseRevenueCount
    };
  }
  
  // Calculer les nouvelles valeurs avec croissance composée
  const compoundFactor = Math.pow(1 + evolutionData.growthRate, daysSinceUpdate);
  
  // Calculer d'abord l'augmentation des publicités
  const newAdsCount = Math.floor(
    evolutionData.baseAdsCount * compoundFactor + 
    evolutionData.dailyAdsIncrease * daysSinceUpdate
  );
  
  // Puis calculer les revenus correspondants (avec ratio + un peu de bruit)
  const adsIncrease = newAdsCount - evolutionData.baseAdsCount;
  const directRevenueFromAds = adsIncrease * evolutionData.correlationRatio * (0.98 + Math.random() * 0.04);
  
  const newRevenueCount = Math.floor(
    evolutionData.baseRevenueCount * compoundFactor + 
    evolutionData.dailyRevenueIncrease * daysSinceUpdate +
    directRevenueFromAds
  );
  
  // Mettre à jour les données d'évolution avec les nouvelles valeurs de base
  const updatedData: StatsEvolutionData = {
    ...evolutionData,
    lastUpdateTime: now,
    baseAdsCount: newAdsCount,
    baseRevenueCount: newRevenueCount,
    // Légère variation du taux de croissance pour plus de réalisme
    growthRate: evolutionData.growthRate * (0.95 + (Math.random() * 0.1))
  };
  
  // Persister les données mises à jour
  persistEvolutionData(updatedData);
  
  return { adsCount: newAdsCount, revenueCount: newRevenueCount };
};

/**
 * Persiste les données d'évolution dans le stockage local
 */
const persistEvolutionData = (data: StatsEvolutionData): void => {
  try {
    localStorage.setItem(STATS_EVOLUTION_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Erreur lors de la sauvegarde des données d\'évolution:', e);
  }
};

/**
 * Vérifie si les valeurs ont besoin d'être mises à jour en fonction du temps écoulé
 * @returns true si une mise à jour est nécessaire
 */
export const shouldUpdateCounters = (): boolean => {
  const storedData = localStorage.getItem(STATS_EVOLUTION_KEY);
  
  if (!storedData) return true;
  
  try {
    const data = JSON.parse(storedData) as StatsEvolutionData;
    const now = Date.now();
    const hoursSinceUpdate = (now - data.lastUpdateTime) / (1000 * 60 * 60);
    
    // Mettre à jour si plus d'une heure s'est écoulée
    return hoursSinceUpdate > 1;
  } catch (e) {
    return true;
  }
};

/**
 * Met à jour les compteurs stockés avec les valeurs actuelles
 * @param adsCount Valeur actuelle du compteur d'annonces
 * @param revenueCount Valeur actuelle du compteur de revenus
 */
export const updateStoredCounters = (adsCount: number, revenueCount: number): void => {
  const evolutionData = initializeEvolutionData();
  
  if (adsCount > evolutionData.baseAdsCount || revenueCount > evolutionData.baseRevenueCount) {
    const updatedData: StatsEvolutionData = {
      ...evolutionData,
      lastUpdateTime: Date.now(),
      baseAdsCount: Math.max(evolutionData.baseAdsCount, adsCount),
      baseRevenueCount: Math.max(evolutionData.baseRevenueCount, revenueCount)
    };
    
    persistEvolutionData(updatedData);
  }
};
