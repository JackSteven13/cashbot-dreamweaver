
import { useState, useEffect, useRef } from 'react';

const LOCAL_STORAGE_KEY_PREFIX = 'user_stats_';

interface UsePersistentStatsParams {
  initialAdsCount?: number;
  initialRevenueCount?: number;
  autoIncrement?: boolean;
  userId?: string;
  forceGrowth?: boolean;
  correlationRatio?: number;
}

// Fonction pour obtenir les clés de stockage spécifiques à l'utilisateur
const getUserSpecificKeys = (userId: string) => ({
  adsCount: `${LOCAL_STORAGE_KEY_PREFIX}${userId}_ads_count`,
  revenueCount: `${LOCAL_STORAGE_KEY_PREFIX}${userId}_revenue_count`,
  lastUpdate: `${LOCAL_STORAGE_KEY_PREFIX}${userId}_last_update`,
});

// Fonction pour sauvegarder des statistiques pour un utilisateur spécifique
const saveStats = (userId: string, adsCount: number, revenueCount: number) => {
  if (!userId) return;
  
  const keys = getUserSpecificKeys(userId);
  try {
    localStorage.setItem(keys.adsCount, adsCount.toString());
    localStorage.setItem(keys.revenueCount, revenueCount.toString());
    localStorage.setItem(keys.lastUpdate, Date.now().toString());
    
    // Enregistrer également les dernières valeurs pour les comparer ultérieurement
    localStorage.setItem(`${keys.adsCount}_last`, adsCount.toString());
    localStorage.setItem(`${keys.revenueCount}_last`, revenueCount.toString());
  } catch (error) {
    console.error('Error saving stats to localStorage:', error);
  }
};

// Fonction pour charger des statistiques pour un utilisateur spécifique
const loadStats = (userId: string): { adsCount: number; revenueCount: number; lastUpdate: number } => {
  if (!userId) {
    return { adsCount: 0, revenueCount: 0, lastUpdate: Date.now() };
  }
  
  const keys = getUserSpecificKeys(userId);
  try {
    const adsCount = parseInt(localStorage.getItem(keys.adsCount) || '0', 10);
    const revenueCount = parseFloat(localStorage.getItem(keys.revenueCount) || '0');
    const lastUpdate = parseInt(localStorage.getItem(keys.lastUpdate) || Date.now().toString(), 10);
    
    return {
      adsCount: isNaN(adsCount) ? 0 : adsCount,
      revenueCount: isNaN(revenueCount) ? 0 : revenueCount,
      lastUpdate: isNaN(lastUpdate) ? Date.now() : lastUpdate
    };
  } catch (error) {
    console.error('Error loading stats from localStorage:', error);
    return { adsCount: 0, revenueCount: 0, lastUpdate: Date.now() };
  }
};

// Fonction pour calculer la croissance basée sur le temps écoulé
const calculateGrowth = (lastUpdate: number, forceGrowth: boolean, correlationRatio: number = 0.75) => {
  const now = Date.now();
  const elapsed = (now - lastUpdate) / 1000; // secondes écoulées
  
  // Si moins de 10 secondes se sont écoulées, pas de croissance
  if (elapsed < 10 && !forceGrowth) return { adsGrowth: 0, revenueGrowth: 0 };
  
  // Calculer une croissance raisonnable basée sur le temps écoulé
  // Plus de temps = plus de croissance, mais avec une limite pour éviter des sauts trop grands
  const baseGrowth = Math.min(elapsed / 10, 30); // Limiter à 30 unités max
  const randomFactor = 0.8 + Math.random() * 0.4; // 80% à 120% de variation aléatoire
  
  const adsGrowth = Math.floor(baseGrowth * randomFactor);
  
  // Assurer que les revenus augmentent proportionnellement aux annonces
  const revenueGrowth = adsGrowth * correlationRatio * (0.95 + Math.random() * 0.1);
  
  return { adsGrowth, revenueGrowth };
};

const usePersistentStats = ({
  initialAdsCount = 0,
  initialRevenueCount = 0,
  autoIncrement = false,
  userId = '',
  forceGrowth = false,
  correlationRatio = 0.75
}: UsePersistentStatsParams) => {
  // Ne chargez les statistiques que si un userId est fourni
  const initialStats = userId ? loadStats(userId) : { adsCount: initialAdsCount, revenueCount: initialRevenueCount, lastUpdate: Date.now() };
  
  // Utilisez toujours la valeur la plus élevée entre les valeurs initiales et celles chargées
  const [adsCount, setAdsCount] = useState(Math.max(initialStats.adsCount, initialAdsCount));
  const [revenueCount, setRevenueCount] = useState(Math.max(initialStats.revenueCount, initialRevenueCount));
  
  // Gardez l'ID utilisateur dans une référence pour les effets
  const userIdRef = useRef(userId);
  
  // Mettre à jour la référence userId si elle change
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  
  // Charger les données initiales chaque fois que l'ID utilisateur change
  useEffect(() => {
    if (!userId) return;
    
    const stats = loadStats(userId);
    setAdsCount(Math.max(stats.adsCount, initialAdsCount));
    setRevenueCount(Math.max(stats.revenueCount, initialRevenueCount));
  }, [userId, initialAdsCount, initialRevenueCount]);
  
  // Persistez les modifications lorsque les compteurs changent
  useEffect(() => {
    if (!userId) return;
    saveStats(userId, adsCount, revenueCount);
  }, [adsCount, revenueCount, userId]);
  
  // Croissance automatique toutes les 30 secondes si autoIncrement est activé
  useEffect(() => {
    if (!autoIncrement || !userId) return;
    
    const autoIncrementInterval = setInterval(() => {
      const stats = loadStats(userId);
      const { adsGrowth, revenueGrowth } = calculateGrowth(stats.lastUpdate, forceGrowth, correlationRatio);
      
      if (adsGrowth > 0 || revenueGrowth > 0) {
        setAdsCount(prevAdsCount => prevAdsCount + adsGrowth);
        setRevenueCount(prevRevenueCount => prevRevenueCount + revenueGrowth);
        
        // Enregistrer la dernière mise à jour
        const keys = getUserSpecificKeys(userId);
        localStorage.setItem(keys.lastUpdate, Date.now().toString());
      }
    }, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(autoIncrementInterval);
  }, [autoIncrement, forceGrowth, userId, correlationRatio]);
  
  // Effet pour calculer la croissance depuis la dernière visite (lorsque l'utilisateur revient)
  useEffect(() => {
    if (!userId) return;
    
    const lastVisitKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}_last_visit`;
    const lastVisit = parseInt(localStorage.getItem(lastVisitKey) || '0', 10);
    const now = Date.now();
    
    // Si c'est la première visite ou si moins de 5 minutes se sont écoulées, ne rien faire
    if (lastVisit === 0 || (now - lastVisit) < 5 * 60 * 1000) {
      localStorage.setItem(lastVisitKey, now.toString());
      return;
    }
    
    // Calculer une croissance raisonnable basée sur le temps d'absence
    const minutesAway = Math.floor((now - lastVisit) / (60 * 1000));
    if (minutesAway > 5) { // Si l'utilisateur a été absent plus de 5 minutes
      // Croissance basée sur le temps d'absence
      const adsGrowth = Math.min(minutesAway * 3, 500); // Limiter à 500 unités max
      const revenueGrowth = adsGrowth * correlationRatio * (0.97 + Math.random() * 0.06);
      
      setAdsCount(prevAdsCount => prevAdsCount + adsGrowth);
      setRevenueCount(prevRevenueCount => prevRevenueCount + revenueGrowth);
      
      console.log(`L'utilisateur était absent pendant ${minutesAway} minutes. Croissance ajoutée: ${adsGrowth} annonces, ${revenueGrowth.toFixed(2)}€`);
    }
    
    localStorage.setItem(lastVisitKey, now.toString());
  }, [userId, correlationRatio]);
  
  // Fonction pour incrémenter manuellement les compteurs
  const incrementStats = (adsIncrement = 1, revenueIncrement = correlationRatio) => {
    if (!userId) return;
    
    setAdsCount(prevAdsCount => prevAdsCount + adsIncrement);
    setRevenueCount(prevRevenueCount => prevRevenueCount + revenueIncrement);
  };
  
  return {
    adsCount,
    revenueCount,
    incrementStats
  };
};

export default usePersistentStats;
