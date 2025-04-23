
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
    
    // Synchroniser les deux compteurs globaux pour tous les composants
    window.dispatchEvent(new CustomEvent('stats:update', {
      detail: { adsCount, revenueCount }
    }));
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
const calculateGrowth = (lastUpdate: number, forceGrowth: boolean, correlationRatio: number = 0.98) => {
  const now = Date.now();
  const elapsed = (now - lastUpdate) / 1000; // secondes écoulées
  
  // Si moins de 5 secondes se sont écoulées, pas de croissance
  if (elapsed < 5 && !forceGrowth) return { adsGrowth: 0, revenueGrowth: 0 };
  
  // Calculer une croissance raisonnable basée sur le temps écoulé
  // Plus de temps = plus de croissance, mais avec une limite pour éviter des sauts trop grands
  const baseGrowth = Math.min(elapsed / 5, 50); // Limiter à 50 unités max
  const randomFactor = 0.9 + Math.random() * 0.2; // 90% à 110% de variation aléatoire
  
  const adsGrowth = Math.floor(baseGrowth * randomFactor);
  
  // Assurer que les revenus augmentent proportionnellement aux annonces (presque 1:1)
  const revenueGrowth = adsGrowth * correlationRatio * (0.98 + Math.random() * 0.04);
  
  return { adsGrowth, revenueGrowth };
};

const usePersistentStats = ({
  initialAdsCount = 0,
  initialRevenueCount = 0,
  autoIncrement = false,
  userId = '',
  forceGrowth = false,
  correlationRatio = 0.98
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
    
    // Écouter les événements de mise à jour globale
    const handleStatUpdate = (event: CustomEvent) => {
      if (event.detail) {
        const { adsCount: newAdsCount, revenueCount: newRevenueCount } = event.detail;
        if (newAdsCount > adsCount) {
          setAdsCount(newAdsCount);
        }
        if (newRevenueCount > revenueCount) {
          setRevenueCount(newRevenueCount);
        }
      }
    };
    
    window.addEventListener('stats:update' as any, handleStatUpdate);
    
    return () => {
      window.removeEventListener('stats:update' as any, handleStatUpdate);
    };
  }, [userId, initialAdsCount, initialRevenueCount, adsCount, revenueCount]);
  
  // Persistez les modifications lorsque les compteurs changent
  useEffect(() => {
    if (!userId) return;
    saveStats(userId, adsCount, revenueCount);
  }, [adsCount, revenueCount, userId]);
  
  // Croissance automatique plus fréquente (toutes les 20 secondes) si autoIncrement est activé
  useEffect(() => {
    if (!autoIncrement || !userId) return;
    
    const autoIncrementInterval = setInterval(() => {
      const stats = loadStats(userId);
      const { adsGrowth, revenueGrowth } = calculateGrowth(stats.lastUpdate, forceGrowth, correlationRatio);
      
      if (adsGrowth > 0 || revenueGrowth > 0) {
        setAdsCount(prevAdsCount => {
          const newAdsCount = prevAdsCount + adsGrowth;
          // Mise à jour synchrone du revenu pour maintenir le rapport
          const newRevenueCount = revenueCount + revenueGrowth;
          setRevenueCount(newRevenueCount);
          
          // Enregistrer la dernière mise à jour
          const keys = getUserSpecificKeys(userId);
          localStorage.setItem(keys.lastUpdate, Date.now().toString());
          
          return newAdsCount;
        });
      }
    }, 20000); // Toutes les 20 secondes
    
    return () => clearInterval(autoIncrementInterval);
  }, [autoIncrement, forceGrowth, userId, correlationRatio, revenueCount]);
  
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
    if (minutesAway > 3) { // Si l'utilisateur a été absent plus de 3 minutes
      // Croissance basée sur le temps d'absence
      const adsGrowth = Math.min(minutesAway * 8, 900); // Limiter à 900 unités max
      const revenueGrowth = adsGrowth * correlationRatio * (0.98 + Math.random() * 0.04);
      
      setAdsCount(prevAdsCount => prevAdsCount + adsGrowth);
      setRevenueCount(prevRevenueCount => prevRevenueCount + revenueGrowth);
      
      console.log(`L'utilisateur était absent pendant ${minutesAway} minutes. Croissance ajoutée: ${adsGrowth} annonces, ${revenueGrowth.toFixed(2)}€`);
    }
    
    localStorage.setItem(lastVisitKey, now.toString());
  }, [userId, correlationRatio]);
  
  // Fonction pour incrémenter manuellement les compteurs
  const incrementStats = (adsIncrement = 1, revenueIncrement = correlationRatio) => {
    if (!userId) return;
    
    setAdsCount(prevAdsCount => {
      const newAdsCount = prevAdsCount + adsIncrement;
      // Si pas de revenueIncrement spécifié, utiliser le rapport de corrélation
      const effectiveRevenueIncrement = revenueIncrement || (adsIncrement * correlationRatio);
      const newRevenueCount = revenueCount + effectiveRevenueIncrement;
      setRevenueCount(newRevenueCount);
      
      // Émettre un événement pour synchroniser tous les autres composants
      window.dispatchEvent(new CustomEvent('stats:update', {
        detail: { adsCount: newAdsCount, revenueCount: newRevenueCount }
      }));
      
      return newAdsCount;
    });
  };
  
  return {
    adsCount,
    revenueCount,
    incrementStats
  };
};

export default usePersistentStats;
