
import { useState, useEffect, useCallback } from 'react';
import { useUserSession } from '../useUserSession';
import { 
  getPersistentStats, 
  savePersistentStats, 
  incrementPersistentStats 
} from '@/utils/stats/persistentStats';

interface UsePersistentStatsOptions {
  initialAdsCount?: number;
  initialRevenueCount?: number;
  autoIncrement?: boolean;
  userId?: string;
}

export const usePersistentStats = (options: UsePersistentStatsOptions = {}) => {
  const { userData } = useUserSession();
  const userId = options.userId || userData?.profile?.id;
  
  // Récupérer les statistiques persistantes avec l'ID utilisateur
  const initialStats = getPersistentStats(userId);
  
  // Initialiser les états avec les valeurs persistantes ou les valeurs par défaut
  const [adsCount, setAdsCount] = useState(
    options.initialAdsCount || initialStats.adsCount
  );
  
  const [revenueCount, setRevenueCount] = useState(
    options.initialRevenueCount || initialStats.revenueCount
  );
  
  // Incrémenter les statistiques de manière contrôlée
  const incrementStats = useCallback((adsIncrement: number, revenueIncrement: number) => {
    const newStats = incrementPersistentStats(adsIncrement, revenueIncrement, userId);
    
    setAdsCount(newStats.adsCount);
    setRevenueCount(newStats.revenueCount);
    
    return newStats;
  }, [userId]);
  
  // Fonction pour mettre à jour manuellement les statistiques
  const updateStats = useCallback((newAdsCount: number, newRevenueCount: number) => {
    // Protéger contre les valeurs invalides
    if (isNaN(newAdsCount) || isNaN(newRevenueCount)) {
      console.error("Tentative de mise à jour des statistiques avec des valeurs invalides:", {
        newAdsCount,
        newRevenueCount
      });
      return;
    }
    
    // Sauvegarder les nouvelles valeurs (avec protection contre la diminution)
    savePersistentStats(newAdsCount, newRevenueCount, userId);
    
    // Mettre à jour les états locaux
    setAdsCount(prev => Math.max(prev, newAdsCount));
    setRevenueCount(prev => Math.max(prev, newRevenueCount));
  }, [userId]);
  
  // Incrémenter automatiquement les statistiques à intervalles réguliers
  useEffect(() => {
    if (!options.autoIncrement) return;
    
    const interval = setInterval(() => {
      const adsIncrement = Math.floor(Math.random() * 50) + 10;
      const revenueIncrement = Math.floor(Math.random() * 25) + 5;
      
      incrementStats(adsIncrement, revenueIncrement);
    }, 45000); // Incrémenter toutes les 45 secondes
    
    return () => clearInterval(interval);
  }, [options.autoIncrement, incrementStats]);
  
  // Synchroniser les statistiques au montage du composant et lorsque l'ID utilisateur change
  useEffect(() => {
    if (!userId) return;
    
    const storedStats = getPersistentStats(userId);
    
    // Toujours prendre les valeurs les plus élevées
    setAdsCount(prev => Math.max(prev, storedStats.adsCount));
    setRevenueCount(prev => Math.max(prev, storedStats.revenueCount));
    
    // Réécouteur pour les changements de statistiques
    const handleStatsChange = (event: CustomEvent) => {
      const { adsCount: newAdsCount, revenueCount: newRevenueCount } = event.detail || {};
      
      if (newAdsCount && newRevenueCount) {
        updateStats(newAdsCount, newRevenueCount);
      }
    };
    
    window.addEventListener('stats:update' as any, handleStatsChange);
    
    return () => {
      window.removeEventListener('stats:update' as any, handleStatsChange);
    };
  }, [userId, updateStats]);
  
  return {
    adsCount,
    revenueCount,
    updateStats,
    incrementStats
  };
};

export default usePersistentStats;
