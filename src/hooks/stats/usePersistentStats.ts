
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
  
  // Garantir la synchronisation parfaite entre publicités et revenus
  const PERFECT_CORRELATION_RATIO = 0.76203;
  const calculatedRevenue = adsCount * PERFECT_CORRELATION_RATIO;
  
  // Utiliser la valeur de revenu calculée pour garantir la corrélation
  const finalRevenueCount = calculatedRevenue;
  
  const keys = getUserSpecificKeys(userId);
  try {
    localStorage.setItem(keys.adsCount, adsCount.toString());
    localStorage.setItem(keys.revenueCount, finalRevenueCount.toString());
    localStorage.setItem(keys.lastUpdate, Date.now().toString());
    
    // Enregistrer également les dernières valeurs pour les comparer ultérieurement
    localStorage.setItem(`${keys.adsCount}_last`, adsCount.toString());
    localStorage.setItem(`${keys.revenueCount}_last`, finalRevenueCount.toString());
    
    // Synchroniser les deux compteurs globaux pour tous les composants
    window.dispatchEvent(new CustomEvent('stats:update', {
      detail: { adsCount, revenueCount: finalRevenueCount }
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
    
    // Valider et corriger les stats si nécessaire
    const validAdsCount = isNaN(adsCount) ? 0 : adsCount;
    const validRevenueCount = isNaN(revenueCount) ? 0 : revenueCount;
    
    // Vérifier et corriger la corrélation si nécessaire
    const PERFECT_CORRELATION_RATIO = 0.76203;
    const calculatedRevenue = validAdsCount * PERFECT_CORRELATION_RATIO;
    
    // Si la différence est trop grande, utiliser la valeur calculée
    if (Math.abs(validRevenueCount - calculatedRevenue) > 1) {
      console.log(`Correcting revenue count from ${validRevenueCount} to ${calculatedRevenue}`);
      
      // Sauvegarder la valeur corrigée
      if (userId) {
        localStorage.setItem(keys.revenueCount, calculatedRevenue.toString());
      }
      
      return {
        adsCount: validAdsCount,
        revenueCount: calculatedRevenue,
        lastUpdate: isNaN(lastUpdate) ? Date.now() : lastUpdate
      };
    }
    
    return {
      adsCount: validAdsCount,
      revenueCount: validRevenueCount,
      lastUpdate: isNaN(lastUpdate) ? Date.now() : lastUpdate
    };
  } catch (error) {
    console.error('Error loading stats from localStorage:', error);
    return { adsCount: 0, revenueCount: 0, lastUpdate: Date.now() };
  }
};

// Fonction pour calculer la croissance basée sur le temps écoulé
const calculateGrowth = (
  lastUpdate: number, 
  forceGrowth: boolean, 
  correlationRatio: number = 0.76203
) => {
  const now = Date.now();
  const elapsed = (now - lastUpdate) / 1000; // secondes écoulées
  
  // Si moins de 5 secondes se sont écoulées, pas de croissance
  if (elapsed < 5 && !forceGrowth) return { adsGrowth: 0, revenueGrowth: 0 };
  
  // Calculer une croissance raisonnable basée sur le temps écoulé
  // Plus de temps = plus de croissance, mais avec une limite pour éviter des sauts trop grands
  const baseGrowth = Math.min(elapsed / 5, 50); // Limiter à 50 unités max
  const randomFactor = 0.9 + Math.random() * 0.2; // 90% à 110% de variation aléatoire
  
  const adsGrowth = Math.floor(baseGrowth * randomFactor);
  
  // Calculer directement les revenus à partir des publicités pour une corrélation parfaite
  const revenueGrowth = adsGrowth * correlationRatio;
  
  return { adsGrowth, revenueGrowth };
};

const usePersistentStats = ({
  initialAdsCount = 0,
  initialRevenueCount = 0,
  autoIncrement = false,
  userId = '',
  forceGrowth = false,
  correlationRatio = 0.76203 // Ratio fixe pour une corrélation parfaite
}: UsePersistentStatsParams) => {
  // Ne chargez les statistiques que si un userId est fourni
  const initialStats = userId ? loadStats(userId) : { 
    adsCount: initialAdsCount, 
    revenueCount: initialAdsCount * correlationRatio, // Calculer directement pour garantir la corrélation
    lastUpdate: Date.now() 
  };
  
  // Utilisez toujours la valeur la plus élevée entre les valeurs initiales et celles chargées
  const [adsCount, setAdsCount] = useState(Math.max(initialStats.adsCount, initialAdsCount));
  // Calculer le revenu en fonction des publicités pour garantir la synchronisation
  const [revenueCount, setRevenueCount] = useState(Math.max(initialStats.revenueCount, initialAdsCount * correlationRatio));
  
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
    // Toujours calculer les revenus pour garantir la synchronisation
    const syncedRevenue = Math.max(stats.adsCount, initialAdsCount) * correlationRatio;
    setRevenueCount(syncedRevenue);
    
    // Écouter les événements de mise à jour globale
    const handleStatUpdate = (event: CustomEvent) => {
      if (event.detail) {
        const { adsCount: newAdsCount, revenueCount: newRevenueCount } = event.detail;
        
        if (newAdsCount > adsCount) {
          setAdsCount(newAdsCount);
          // Calculer les revenus pour garantir la synchronisation
          setRevenueCount(newAdsCount * correlationRatio);
        }
      }
    };
    
    window.addEventListener('stats:update' as any, handleStatUpdate);
    
    return () => {
      window.removeEventListener('stats:update' as any, handleStatUpdate);
    };
  }, [userId, initialAdsCount, correlationRatio]);
  
  // Persistez les modifications lorsque les compteurs changent
  useEffect(() => {
    if (!userId) return;
    
    // Calculer directement le revenu à partir des publicités
    const syncedRevenue = adsCount * correlationRatio;
    
    // Vérifier si le revenu actuel est synchronisé
    if (Math.abs(revenueCount - syncedRevenue) > 0.1) {
      console.log(`Forcing revenue sync: ${revenueCount} -> ${syncedRevenue}`);
      setRevenueCount(syncedRevenue);
    }
    
    saveStats(userId, adsCount, syncedRevenue);
  }, [adsCount, userId, correlationRatio]);
  
  // Croissance automatique plus synchronisée
  useEffect(() => {
    if (!autoIncrement || !userId) return;
    
    const autoIncrementInterval = setInterval(() => {
      const stats = loadStats(userId);
      const { adsGrowth, revenueGrowth } = calculateGrowth(stats.lastUpdate, forceGrowth, correlationRatio);
      
      if (adsGrowth > 0) {
        setAdsCount(prevAdsCount => {
          const newAdsCount = prevAdsCount + adsGrowth;
          // Mise à jour synchrone du revenu pour maintenir le rapport
          const newRevenueCount = newAdsCount * correlationRatio;
          setRevenueCount(newRevenueCount);
          
          return newAdsCount;
        });
      }
    }, 5000); // Synchronisation moins fréquente
    
    return () => clearInterval(autoIncrementInterval);
  }, [autoIncrement, forceGrowth, userId, correlationRatio]);
  
  // Fonction pour incrémenter manuellement les compteurs
  const incrementStats = (adsIncrement = 1, revenueIncrement?: number) => {
    if (!userId) return;
    
    setAdsCount(prevAdsCount => {
      const newAdsCount = prevAdsCount + adsIncrement;
      
      // Toujours calculer le revenu en fonction des publicités
      const calculatedRevenueIncrement = adsIncrement * correlationRatio;
      // Utiliser la valeur calculée pour garantir la corrélation
      const effectiveRevenueIncrement = calculatedRevenueIncrement;
      
      const newRevenueCount = newAdsCount * correlationRatio;
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
