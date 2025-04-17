
import React, { useEffect, useState } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';
import { loadStoredValues, incrementDateLinkedStats } from '@/hooks/stats/utils/storageManager';

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
    
    // Auto-increment effect to ensure values are never stagnant
    const autoIncrementInterval = setInterval(() => {
      // Forcer l'incrément des statistiques pour éviter la stagnation
      const incrementedStats = incrementDateLinkedStats();
      
      // Mettre à jour l'interface avec une fraction des nouveaux incréments
      // pour une progression visuelle plus fluide
      setStableValues(prev => {
        const adsIncrement = incrementedStats.adsCount - prev.adsCount;
        const revenueIncrement = incrementedStats.revenueCount - prev.revenueCount;
        
        // Si les incréments sont positifs, ajouter une fraction
        return {
          adsCount: adsIncrement > 0 
            ? prev.adsCount + Math.max(1, Math.floor(adsIncrement * 0.2)) 
            : prev.adsCount,
          revenueCount: revenueIncrement > 0 
            ? prev.revenueCount + Math.max(0.1, revenueIncrement * 0.2)
            : prev.revenueCount
        };
      });
    }, 45000 + Math.random() * 30000); // Entre 45 et 75 secondes
    
    return () => {
      clearInterval(syncInterval);
      clearInterval(autoIncrementInterval);
    };
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
