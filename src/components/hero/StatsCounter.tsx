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

  const stableValuesRef = useRef({
    adsCount: MINIMUM_ADS,
    revenueCount: MINIMUM_REVENUE,
    lastUpdate: Date.now(),
    lastSyncTime: Date.now()
  });
  
  const CORRELATION_RATIO = 0.76203;
  
  const [displayValues, setDisplayValues] = useState(() => {
    ensureProgressiveValues();
    const consistentStats = getDateConsistentStats();
    const randomVariance = (value: number) => {
      const variance = 1 + ((Math.random() - 0.5) * 0.01);
      return Math.floor(value * variance);
    };
    const ads = Math.min(Math.max(randomVariance(MINIMUM_ADS), consistentStats.adsCount), 152847);
    const revenue = ads * CORRELATION_RATIO;
    return {
      adsCount: ads,
      revenueCount: revenue
    };
  });

  useEffect(() => {
    const regularUpdateInterval = setInterval(() => {
      setDisplayValues(prev => {
        const adsRand = Math.random();
        let adsIncrement = 0;
        if (adsRand > 0.85) adsIncrement = 2;
        else if (adsRand > 0.55) adsIncrement = 1;
        const newAdsCount = prev.adsCount + adsIncrement;

        let newRevenueCount = prev.revenueCount;
        if (adsIncrement > 0) {
          const jitterRatio = CORRELATION_RATIO + ((Math.random() - 0.5) * 0.025);
          const revenueIncrement = adsIncrement * jitterRatio;
          if (Math.random() > 0.25) {
            newRevenueCount = prev.revenueCount + revenueIncrement;
          }
        }
        return {
          adsCount: newAdsCount,
          revenueCount: Math.floor(newRevenueCount)
        };
      });
    }, 12000 + Math.floor(Math.random() * 5000));

    return () => {
      clearInterval(regularUpdateInterval);
    };
  }, []);

  useEffect(() => {
    if (displayedAdsCount > displayValues.adsCount) {
      const newRevenue = displayedAdsCount * CORRELATION_RATIO;
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
        const newRevenueCount = maxAdsCount * CORRELATION_RATIO;
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
      localStorage.setItem('last_displayed_revenue_count', (displayValues.adsCount * CORRELATION_RATIO).toString());
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
