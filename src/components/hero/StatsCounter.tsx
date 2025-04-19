
import React, { useEffect, useState, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';
import { 
  loadStoredValues, 
  incrementDateLinkedStats, 
  enforceMinimumStats, 
  getDateConsistentStats 
} from '@/hooks/stats/utils/storageManager';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 28800, // ~1800 videos/hour × 16 hours = more realistic daily target
  dailyRevenueTarget = 40000 // ~1.5€ average per video × 28,800 videos
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });

  // Utiliser useRef pour stocker des valeurs stables entre les rendus
  const stableValuesRef = useRef({
    adsCount: 40000,
    revenueCount: 50000,
    lastUpdate: Date.now()
  });
  
  // État local pour l'affichage avec initialisation améliorée
  const [displayValues, setDisplayValues] = useState(() => {
    // Récupérer des valeurs cohérentes dès le début
    const consistentStats = getDateConsistentStats();
    return {
      adsCount: consistentStats.adsCount,
      revenueCount: consistentStats.revenueCount
    };
  });
  
  // Synchroniser les valeurs stables avec les valeurs stockées au chargement
  useEffect(() => {
    // Récupérer les valeurs stockées avec progression temporelle intégrée
    const consistentStats = getDateConsistentStats();
    
    // Stocker dans la référence stable
    stableValuesRef.current = {
      adsCount: consistentStats.adsCount,
      revenueCount: consistentStats.revenueCount,
      lastUpdate: Date.now()
    };
    
    // Mettre à jour l'affichage
    setDisplayValues({
      adsCount: consistentStats.adsCount,
      revenueCount: consistentStats.revenueCount
    });
    
    // S'assurer que les valeurs minimales sont respectées
    enforceMinimumStats(40000, 50000);
    
    // Persistance renforcée avec un timestamp
    localStorage.setItem('stats_last_sync', Date.now().toString());
  }, []);
  
  // Synchroniser avec les événements de mise à jour du feed des publicités
  useEffect(() => {
    const handleLocationAdded = (event: CustomEvent) => {
      // Attendre un peu pour que l'analyse soit simulée
      setTimeout(() => {
        // Incrémenter uniquement d'une vidéo
        setDisplayValues(prev => ({
          adsCount: prev.adsCount + 1,
          revenueCount: prev.revenueCount + (Math.random() * 0.5 + 0.2) // 0.2-0.7€
        }));
      }, 1000 + Math.random() * 1500); // Délai entre 1 et 2.5 secondes
    };
    
    window.addEventListener('location:added', handleLocationAdded as EventListener);
    return () => window.removeEventListener('location:added', handleLocationAdded as EventListener);
  }, []);

  // Mettre à jour les valeurs stables et persistantes si les valeurs de useStatsCounter augmentent
  useEffect(() => {
    if (displayedAdsCount > stableValuesRef.current.adsCount) {
      stableValuesRef.current = {
        ...stableValuesRef.current,
        adsCount: displayedAdsCount,
        lastUpdate: Date.now()
      };
      
      setDisplayValues(prev => ({
        ...prev,
        adsCount: displayedAdsCount
      }));
    }
    
    if (displayedRevenueCount > stableValuesRef.current.revenueCount) {
      stableValuesRef.current = {
        ...stableValuesRef.current,
        revenueCount: displayedRevenueCount,
        lastUpdate: Date.now()
      };
      
      setDisplayValues(prev => ({
        ...prev,
        revenueCount: displayedRevenueCount
      }));
    }
  }, [displayedAdsCount, displayedRevenueCount]);

  // Effet pour assurer la progression continue, mais très lente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastUpdate = now - stableValuesRef.current.lastUpdate;
        
        // Si plus de 5 minutes se sont écoulées, récupérer les statistiques cohérentes
        if (timeSinceLastUpdate > 5 * 60 * 1000) {
          const consistentStats = getDateConsistentStats();
          
          // Mettre à jour seulement si les nouvelles valeurs sont plus grandes
          const newAdsCount = Math.max(stableValuesRef.current.adsCount, consistentStats.adsCount);
          const newRevenueCount = Math.max(stableValuesRef.current.revenueCount, consistentStats.revenueCount);
          
          // Mettre à jour la référence stable
          stableValuesRef.current = {
            adsCount: newAdsCount,
            revenueCount: newRevenueCount,
            lastUpdate: now
          };
          
          // Mettre à jour l'affichage
          setDisplayValues({
            adsCount: newAdsCount,
            revenueCount: newRevenueCount
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-4 md:mb-6">
      <StatPanel 
        value={displayValues.adsCount.toLocaleString('fr-FR')}
        label="Publicités analysées"
        className="text-sm animate-pulse-slow" 
      />
      <StatPanel 
        value={formatRevenue(displayValues.revenueCount)}
        label="Revenus générés"
        className="text-sm animate-pulse-slow" 
      />
    </div>
  );
};

export default StatsCounter;
