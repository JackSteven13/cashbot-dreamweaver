
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
  // Use useMemo to avoid recalculating these values on every render
  const MINIMUM_ADS = useMemo(() => 36742, []);
  const MINIMUM_REVENUE = useMemo(() => 28000, []);
  const CORRELATION_RATIO = useMemo(() => 0.76203, []);
  
  // Stable reference for session ID and values
  const anonymousSessionId = useRef(Math.random().toString(36).substring(2, 15));
  const stableValuesRef = useRef({
    adsCount: MINIMUM_ADS,
    revenueCount: MINIMUM_REVENUE,
    lastUpdate: Date.now(),
    lastSyncTime: Date.now()
  });
  
  // Define getSessionBasedId function before it's used
  const getSessionBasedId = useCallback(() => {
    try {
      const userId = localStorage.getItem('lastKnownUserId');
      return userId || anonymousSessionId.current;
    } catch (e) {
      return anonymousSessionId.current;
    }
  }, []);

  // Helper function for random variance wrapped in useCallback
  const randomVariance = useCallback((value: number) => {
    const sessionId = getSessionBasedId();
    const sessionVariance = sessionId ? 
      (sessionId.charCodeAt(0) % 10) / 100 : 0;
      
    const variance = 1 + ((Math.random() - 0.5 + sessionVariance) * 0.01);
    return Math.floor(value * variance);
  }, [getSessionBasedId]);
  
  // Get stats from hook
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  // Initialize display values with useState and stable initialization function - make sure randomVariance is defined before use
  const [displayValues, setDisplayValues] = useState(() => {
    ensureProgressiveValues();
    const consistentStats = getDateConsistentStats();
    
    const ads = Math.max(randomVariance(MINIMUM_ADS), consistentStats.adsCount);
    const revenue = ads * CORRELATION_RATIO;
    return {
      adsCount: Math.min(ads, 152847), // Cap at maximum value
      revenueCount: Math.min(revenue, 116329) // Cap at maximum value
    };
  });

  // Regular update effect with stable dependencies
  useEffect(() => {
    const sessionId = getSessionBasedId();
    // Use the session ID to create consistent yet unique update rates per user
    const sessionSpecificRate = sessionId ? 
      (sessionId.charCodeAt(0) % 5 + 10) * 1000 : 12000;
      
    const regularUpdateInterval = setInterval(() => {
      setDisplayValues(prev => {
        const adsRand = Math.random();
        let adsIncrement = 0;
        if (adsRand > 0.85) adsIncrement = 2;
        else if (adsRand > 0.55) adsIncrement = 1;
        const newAdsCount = Math.min(prev.adsCount + adsIncrement, 152847);

        let newRevenueCount = prev.revenueCount;
        if (adsIncrement > 0) {
          const sessionVariation = sessionId ? 
            (sessionId.charCodeAt(0) % 10 - 5) / 1000 : 0;
            
          const jitterRatio = CORRELATION_RATIO + ((Math.random() - 0.5) * 0.025) + sessionVariation;
          const revenueIncrement = adsIncrement * jitterRatio;
          if (Math.random() > 0.25) {
            newRevenueCount = Math.min(prev.revenueCount + revenueIncrement, 116329);
          }
        }
        return {
          adsCount: newAdsCount,
          revenueCount: Math.floor(newRevenueCount)
        };
      });
    }, sessionSpecificRate + Math.floor(Math.random() * 5000));

    return () => clearInterval(regularUpdateInterval);
  }, [getSessionBasedId, CORRELATION_RATIO]); // Add proper dependencies

  // Update based on displayedAdsCount changes, but only when significant
  useEffect(() => {
    if (displayedAdsCount > displayValues.adsCount + 10) {
      const newRevenue = displayedAdsCount * CORRELATION_RATIO;
      setDisplayValues({
        adsCount: displayedAdsCount,
        revenueCount: newRevenue
      });
    }
  }, [displayedAdsCount, displayValues.adsCount, CORRELATION_RATIO]);

  // Handle visibility changes with memoized handler
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
  }, [displayValues, CORRELATION_RATIO]);

  // Storage persistence with dependency cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('last_displayed_ads_count', displayValues.adsCount.toString());
      localStorage.setItem('last_displayed_revenue_count', displayValues.revenueCount.toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [displayValues]);

  const formatAdsDisplay = useCallback((value: number) => {
    return Math.floor(value).toLocaleString('fr-FR');
  }, []);
  
  const formatRevenueDisplay = useCallback((value: number) => {
    return formatRevenue(value);
  }, []);

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
