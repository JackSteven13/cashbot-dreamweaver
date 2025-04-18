
import React, { useEffect, useState, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';
import { loadStoredValues, incrementDateLinkedStats, enforceMinimumStats } from '@/hooks/stats/utils/storageManager';

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

  // Utiliser useRef pour stocker des valeurs stables
  const stableValuesRef = useRef({
    adsCount: 40000,
    revenueCount: 50000
  });
  
  // État local pour l'affichage
  const [displayValues, setDisplayValues] = useState({
    adsCount: 40000,
    revenueCount: 50000
  });
  
  // Initialiser avec les valeurs stockées au chargement
  useEffect(() => {
    const storedValues = loadStoredValues();
    
    // S'assurer que nous avons des valeurs minimales raisonnables
    const safeAdsCount = Math.max(40000, storedValues.adsCount);
    const safeRevenueCount = Math.max(50000, storedValues.revenueCount);
    
    setDisplayValues({
      adsCount: safeAdsCount,
      revenueCount: safeRevenueCount
    });
    
    stableValuesRef.current = {
      adsCount: safeAdsCount,
      revenueCount: safeRevenueCount
    };
    
    // Persistance renforcée
    localStorage.setItem('stats_last_sync', Date.now().toString());
    localStorage.setItem('stats_ads_count', safeAdsCount.toString());
    localStorage.setItem('stats_revenue_count', safeRevenueCount.toString());
  }, []);

  // Mettre à jour les valeurs stables uniquement lorsqu'elles augmentent
  useEffect(() => {
    if (displayedAdsCount > stableValuesRef.current.adsCount) {
      stableValuesRef.current = {
        ...stableValuesRef.current,
        adsCount: displayedAdsCount
      };
      
      setDisplayValues(prev => ({
        ...prev,
        adsCount: displayedAdsCount
      }));
      
      // Persistance immédiate des nouvelles valeurs
      localStorage.setItem('stats_ads_count', displayedAdsCount.toString());
    }
    
    if (displayedRevenueCount > stableValuesRef.current.revenueCount) {
      stableValuesRef.current = {
        ...stableValuesRef.current,
        revenueCount: displayedRevenueCount
      };
      
      setDisplayValues(prev => ({
        ...prev,
        revenueCount: displayedRevenueCount
      }));
      
      // Persistance immédiate des nouvelles valeurs
      localStorage.setItem('stats_revenue_count', displayedRevenueCount.toString());
    }
  }, [displayedAdsCount, displayedRevenueCount]);

  // Effet pour synchroniser les valeurs entre les utilisateurs et sessions
  useEffect(() => {
    // Vérifier périodiquement les mises à jour des statistiques
    const syncInterval = setInterval(() => {
      const refreshedStats = loadStoredValues();
      
      // Utiliser les valeurs les plus élevées pour maintenir une progression
      const newAdsCount = Math.max(refreshedStats.adsCount, stableValuesRef.current.adsCount);
      const newRevenueCount = Math.max(refreshedStats.revenueCount, stableValuesRef.current.revenueCount);
      
      // Mettre à jour seulement si les valeurs sont différentes
      if (newAdsCount !== stableValuesRef.current.adsCount || 
          newRevenueCount !== stableValuesRef.current.revenueCount) {
        
        stableValuesRef.current = {
          adsCount: newAdsCount,
          revenueCount: newRevenueCount
        };
        
        setDisplayValues({
          adsCount: newAdsCount,
          revenueCount: newRevenueCount
        });
        
        // Persistance des valeurs synchronisées
        localStorage.setItem('stats_ads_count', newAdsCount.toString());
        localStorage.setItem('stats_revenue_count', newRevenueCount.toString());
        localStorage.setItem('stats_last_sync', Date.now().toString());
      }
    }, 10000); // Synchroniser toutes les 10 secondes
    
    // Auto-increment effect
    const autoIncrementInterval = setInterval(() => {
      // Incrémenter progressivement les stats
      const incrementedStats = incrementDateLinkedStats();
      
      // Utilisation de pas prédéfinis pour une progression plus naturelle
      const adsIncrement = Math.floor(Math.random() * 30) + 10;
      const revenueIncrement = Math.random() * 5 + 1;
      
      // Mise à jour progressive
      const newAdsCount = stableValuesRef.current.adsCount + adsIncrement;
      const newRevenueCount = stableValuesRef.current.revenueCount + revenueIncrement;
      
      stableValuesRef.current = {
        adsCount: newAdsCount,
        revenueCount: newRevenueCount
      };
      
      setDisplayValues({
        adsCount: newAdsCount,
        revenueCount: newRevenueCount
      });
      
      // Persistance des valeurs incrémentées
      localStorage.setItem('stats_ads_count', newAdsCount.toString());
      localStorage.setItem('stats_revenue_count', newRevenueCount.toString());
      localStorage.setItem('stats_last_update', Date.now().toString());
    }, 60000); // Mettre à jour chaque minute

    // S'assurer que les valeurs ne tombent jamais en dessous des minimums
    const minimumCheckInterval = setInterval(() => {
      enforceMinimumStats(40000, 50000);
      
      // Récupérer les minimums appliqués
      const minimums = loadStoredValues();
      
      // S'assurer que nos valeurs respectent aussi les minimums
      if (minimums.adsCount > stableValuesRef.current.adsCount) {
        const newAdsCount = minimums.adsCount;
        stableValuesRef.current = {
          ...stableValuesRef.current,
          adsCount: newAdsCount
        };
        setDisplayValues(prev => ({...prev, adsCount: newAdsCount}));
      }
      
      if (minimums.revenueCount > stableValuesRef.current.revenueCount) {
        const newRevenueCount = minimums.revenueCount;
        stableValuesRef.current = {
          ...stableValuesRef.current,
          revenueCount: newRevenueCount
        };
        setDisplayValues(prev => ({...prev, revenueCount: newRevenueCount}));
      }
    }, 20000); // Vérifier toutes les 20 secondes
    
    return () => {
      clearInterval(syncInterval);
      clearInterval(autoIncrementInterval);
      clearInterval(minimumCheckInterval);
      
      // Sauvegarder les valeurs avant de démonter le composant
      localStorage.setItem('stats_ads_count', stableValuesRef.current.adsCount.toString());
      localStorage.setItem('stats_revenue_count', stableValuesRef.current.revenueCount.toString());
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
