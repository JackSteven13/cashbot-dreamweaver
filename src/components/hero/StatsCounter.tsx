
import React, { useEffect, useState, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';
import { 
  loadStoredValues, 
  incrementDateLinkedStats, 
  enforceMinimumStats, 
  getDateConsistentStats,
  ensureProgressiveValues
} from '@/hooks/stats/utils/storageManager';
import { synchronizeRevenueWithAds } from '@/hooks/stats/utils/revenueCalculator';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 4723,
  dailyRevenueTarget = 3819
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });

  const MINIMUM_ADS = 36742;
  const MINIMUM_REVENUE = 28000;
  const CORRELATION_RATIO = 0.76203;
  
  // Générer une clé unique pour les sessions qui ne sont pas connectées
  // Cela permettra d'avoir des valeurs différentes lors de la navigation anonyme
  const anonymousSessionId = useRef(Math.random().toString(36).substring(2, 15));
  
  // Récupérer un ID basé sur la session actuelle ou générer un ID anonyme
  const getSessionBasedId = () => {
    try {
      // Essayer de récupérer l'ID utilisateur du localStorage (utilisé si connecté)
      const userId = localStorage.getItem('lastKnownUserId');
      // Si pas d'ID utilisateur, utiliser un ID de session aléatoire
      return userId || anonymousSessionId.current;
    } catch (e) {
      return anonymousSessionId.current;
    }
  };
  
  const stableValuesRef = useRef({
    adsCount: MINIMUM_ADS,
    revenueCount: MINIMUM_REVENUE,
    lastUpdate: Date.now(),
    lastSyncTime: Date.now()
  });
  
  const [displayValues, setDisplayValues] = useState(() => {
    ensureProgressiveValues();
    const consistentStats = getDateConsistentStats();
    const randomVariance = (value: number) => {
      // Utiliser l'ID de session pour avoir une variance unique par utilisateur/visite
      const sessionId = getSessionBasedId();
      const sessionVariance = sessionId ? 
        (sessionId.charCodeAt(0) % 10) / 100 : 0; // Variance entre -0.05 et +0.05
        
      const variance = 1 + ((Math.random() - 0.5 + sessionVariance) * 0.01);
      return Math.floor(value * variance);
    };
    const ads = Math.min(Math.max(randomVariance(MINIMUM_ADS), consistentStats.adsCount), 152847);
    
    // IMPORTANT: Toujours calculer le revenu à partir des pubs pour maintenir la cohérence
    const revenue = synchronizeRevenueWithAds(ads);
    
    return {
      adsCount: ads,
      revenueCount: revenue
    };
  });

  useEffect(() => {
    const sessionId = getSessionBasedId();
    // Ajuster l'intervalle en fonction de l'ID de session pour que chaque utilisateur ou visite ait un rythme différent
    const sessionSpecificRate = sessionId ? 
      (sessionId.charCodeAt(0) % 5 + 6) * 1000 : // Entre 6 et 11 secondes selon l'ID - Plus rapide pour être visible
      8000;
      
    const regularUpdateInterval = setInterval(() => {
      setDisplayValues(prev => {
        const adsRand = Math.random();
        let adsIncrement = 0;
        if (adsRand > 0.70) adsIncrement = 2;  // Augmenté la probabilité d'incrément
        else if (adsRand > 0.40) adsIncrement = 1;
        const newAdsCount = prev.adsCount + adsIncrement;

        // IMPORTANT: Toujours calculer les nouveaux revenus basés sur le nouveau nombre de pubs
        const newRevenueCount = synchronizeRevenueWithAds(newAdsCount);

        return {
          adsCount: newAdsCount,
          revenueCount: newRevenueCount
        };
      });
    }, sessionSpecificRate + Math.floor(Math.random() * 3000)); // Variation réduite dans l'intervalle

    return () => {
      clearInterval(regularUpdateInterval);
    };
  }, []);

  useEffect(() => {
    if (displayedAdsCount > displayValues.adsCount) {
      // IMPORTANT: Recalculer les revenus à partir des pubs
      const newRevenue = synchronizeRevenueWithAds(displayedAdsCount);
      setDisplayValues({
        adsCount: displayedAdsCount,
        revenueCount: newRevenue
      });
    }
  }, [displayedAdsCount]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ensureProgressiveValues();
        const consistentStats = getDateConsistentStats();
        const maxAdsCount = Math.max(displayValues.adsCount, consistentStats.adsCount);
        
        // IMPORTANT: Toujours recalculer les revenus
        const newRevenueCount = synchronizeRevenueWithAds(maxAdsCount);
        
        setDisplayValues({
          adsCount: maxAdsCount,
          revenueCount: newRevenueCount
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [displayValues]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('last_displayed_ads_count', displayValues.adsCount.toString());
      
      // IMPORTANT: Sauvegarder un revenu parfaitement cohérent
      const syncedRevenue = synchronizeRevenueWithAds(displayValues.adsCount);
      localStorage.setItem('last_displayed_revenue_count', syncedRevenue.toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [displayValues]);

  const formatAdsDisplay = (value: number) => {
    const baseFormatted = Math.floor(value).toLocaleString('fr-FR');
    return baseFormatted;
  };
  
  const formatRevenueDisplay = (value: number) => {
    return formatRevenue(value);
  };

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-4 md:mb-6">
      <StatPanel 
        value={formatAdsDisplay(displayValues.adsCount)}
        label="Publicités analysées"
        className="text-sm animate-pulse-slow" 
      />
      <StatPanel 
        value={formatRevenueDisplay(displayValues.revenueCount)}
        label="Revenus générés"
        className="text-sm animate-pulse-slow" 
      />
    </div>
  );
};

export default StatsCounter;
