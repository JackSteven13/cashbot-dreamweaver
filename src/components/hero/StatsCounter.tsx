
import React, { useEffect, useState } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';
import { loadStoredValues } from '@/hooks/stats/utils/storageManager';

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

  // État local pour éviter les clignotements pendant le chargement initial
  const [stableValues, setStableValues] = useState(() => {
    const initialStats = loadStoredValues();
    return {
      adsCount: initialStats.adsCount,
      revenueCount: initialStats.revenueCount
    };
  });

  // Mettre à jour les valeurs stables uniquement lorsqu'elles augmentent
  useEffect(() => {
    if (displayedAdsCount > stableValues.adsCount) {
      setStableValues(prev => ({
        ...prev,
        adsCount: displayedAdsCount
      }));
    }
    
    if (displayedRevenueCount > stableValues.revenueCount) {
      setStableValues(prev => ({
        ...prev,
        revenueCount: displayedRevenueCount
      }));
    }
  }, [displayedAdsCount, displayedRevenueCount]);

  // Effet pour synchroniser les valeurs entre les utilisateurs
  useEffect(() => {
    // Vérifie périodiquement les mises à jour des statistiques
    const syncInterval = setInterval(() => {
      const refreshedStats = loadStoredValues();
      
      // Mettre à jour seulement si les nouvelles valeurs sont plus élevées
      if (refreshedStats.adsCount > stableValues.adsCount) {
        setStableValues(prev => ({
          ...prev,
          adsCount: refreshedStats.adsCount
        }));
      }
      
      if (refreshedStats.revenueCount > stableValues.revenueCount) {
        setStableValues(prev => ({
          ...prev,
          revenueCount: refreshedStats.revenueCount
        }));
      }
    }, 30000); // Vérifier toutes les 30 secondes
    
    return () => clearInterval(syncInterval);
  }, [stableValues]);

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-4 md:mb-6">
      <StatPanel 
        value={stableValues.adsCount.toLocaleString('fr-FR')}
        label="Publicités analysées"
        className="text-sm animate-pulse-slow" 
      />
      <StatPanel 
        value={formatRevenue(stableValues.revenueCount)}
        label="Revenus générés"
        className="text-sm animate-pulse-slow" 
      />
    </div>
  );
};

export default StatsCounter;
