
import { useState, useEffect, useMemo } from 'react';
import { useStatsInitialization } from './stats/useStatsInitialization';
import { useStatsAnimation } from './stats/useStatsAnimation';
import { useStatsCycleManagement } from '@/hooks/stats/useStatsCycleManagement';

interface UseStatsCounterParams {
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

interface StatsCounterData {
  displayedAdsCount: number;
  displayedRevenueCount: number;
}

// Minimum baseline values that should never be dropped below
const MINIMUM_ADS_COUNT = 40000;
const MINIMUM_REVENUE_COUNT = 50000;

// Storage keys for global counters
const STORAGE_KEYS = {
  DISPLAYED_ADS_COUNT: 'displayed_ads_count',
  DISPLAYED_REVENUE_COUNT: 'displayed_revenue_count',
  STATS_LAST_SYNC: 'stats_last_sync'
};

export const useStatsCounter = ({
  dailyAdsTarget = 350000,
  dailyRevenueTarget = 1500000
}: UseStatsCounterParams): StatsCounterData => {
  const {
    adsCount,
    revenueCount,
    displayedAdsCount,
    displayedRevenueCount,
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    initializeCounters
  } = useStatsInitialization({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  const { animateCounters } = useStatsAnimation({
    adsCount,
    revenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount
  });
  
  const { scheduleCycleUpdate, incrementCountersRandomly } = useStatsCycleManagement({
    setAdsCount,
    setRevenueCount,
    setDisplayedAdsCount,
    setDisplayedRevenueCount,
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  // Track initial load state
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [countersInitialized, setCountersInitialized] = useState(false);
  
  // Cookie-based device fingerprint to ensure consistent values across sessions
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  
  // Protect against session reset by storing values in sessionStorage
  useEffect(() => {
    // Create a simple device fingerprint if none exists
    if (!deviceFingerprint) {
      const storedFingerprint = localStorage.getItem('device_fingerprint');
      if (storedFingerprint) {
        setDeviceFingerprint(storedFingerprint);
      } else {
        // Create a new fingerprint based on navigator properties
        const newFingerprint = `${navigator.platform}_${navigator.language}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}`;
        localStorage.setItem('device_fingerprint', newFingerprint);
        setDeviceFingerprint(newFingerprint);
      }
    }
    
    // Restore from sessionStorage if available, which has priority for page refreshes
    const sessionAds = sessionStorage.getItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT);
    const sessionRevenue = sessionStorage.getItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT);
    
    if (sessionAds && sessionRevenue) {
      const parsedAdsCount = parseInt(sessionAds, 10);
      const parsedRevenueCount = parseInt(sessionRevenue, 10);
      
      if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && 
          parsedAdsCount >= MINIMUM_ADS_COUNT && parsedRevenueCount >= MINIMUM_REVENUE_COUNT) {
        
        // Update state with session values
        setAdsCount(parsedAdsCount);
        setRevenueCount(parsedRevenueCount);
        setDisplayedAdsCount(parsedAdsCount);
        setDisplayedRevenueCount(parsedRevenueCount);
        setCountersInitialized(true);
        
        // Also ensure localStorage is in sync
        localStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT, parsedAdsCount.toString());
        localStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, parsedRevenueCount.toString());
      }
    }
  }, [deviceFingerprint, setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Initial load protection and enhancement
  useEffect(() => {
    if (isFirstLoad && !countersInitialized) {
      // First check sessionStorage (priority for page refreshes)
      const sessionAds = sessionStorage.getItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT);
      const sessionRevenue = sessionStorage.getItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT);
      
      if (sessionAds && sessionRevenue) {
        const parsedAdsCount = parseInt(sessionAds, 10);
        const parsedRevenueCount = parseInt(sessionRevenue, 10);
        
        if (!isNaN(parsedAdsCount) && !isNaN(parsedRevenueCount) && 
            parsedAdsCount >= MINIMUM_ADS_COUNT && parsedRevenueCount >= MINIMUM_REVENUE_COUNT) {
          
          setAdsCount(parsedAdsCount);
          setRevenueCount(parsedRevenueCount);
          setDisplayedAdsCount(parsedAdsCount);
          setDisplayedRevenueCount(parsedRevenueCount);
          setCountersInitialized(true);
          setIsFirstLoad(false);
          return;
        }
      }
      
      // Then try localStorage if sessionStorage didn't work
      const storedAdsCount = parseInt(localStorage.getItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT) || '0', 10);
      const storedRevenueCount = parseInt(localStorage.getItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT) || '0', 10);
      
      // If stored values are below minimum, use device-consistent values
      if (isNaN(storedAdsCount) || storedAdsCount < MINIMUM_ADS_COUNT || 
          isNaN(storedRevenueCount) || storedRevenueCount < MINIMUM_REVENUE_COUNT) {
        
        // Use device fingerprint to get consistent "random" values between sessions
        const hash = deviceFingerprint 
          ? deviceFingerprint.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) 
          : Math.random() * 1000;
        
        const consistentRandom = Math.abs(hash) % 10000; // 0-9999 range
        
        const initialAdsCount = MINIMUM_ADS_COUNT + consistentRandom;
        const initialRevenueCount = MINIMUM_REVENUE_COUNT + consistentRandom;
        
        // Update both local state and storage
        setAdsCount(initialAdsCount);
        setRevenueCount(initialRevenueCount);
        setDisplayedAdsCount(initialAdsCount);
        setDisplayedRevenueCount(initialRevenueCount);
        
        localStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT, initialAdsCount.toString());
        localStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, initialRevenueCount.toString());
        
        // Also store in sessionStorage for refresh protection
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT, initialAdsCount.toString());
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, initialRevenueCount.toString());
      } else {
        // Use existing values if they're already above minimum
        setAdsCount(storedAdsCount);
        setRevenueCount(storedRevenueCount);
        setDisplayedAdsCount(storedAdsCount);
        setDisplayedRevenueCount(storedRevenueCount);
        
        // Also store in sessionStorage for refresh protection
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT, storedAdsCount.toString());
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, storedRevenueCount.toString());
      }
      
      setCountersInitialized(true);
      setIsFirstLoad(false);
    }
  }, [
    isFirstLoad, 
    countersInitialized,
    deviceFingerprint,
    setAdsCount, 
    setRevenueCount, 
    setDisplayedAdsCount, 
    setDisplayedRevenueCount
  ]);
  
  useEffect(() => {
    // Save to session storage on beforeunload to ensure values persist across refreshes
    const saveToSession = () => {
      // Save the latest counter values to sessionStorage
      try {
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT, displayedAdsCount.toString());
        sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, displayedRevenueCount.toString());
      } catch (e) {
        console.error('Error saving counters to sessionStorage', e);
      }
    };
    
    window.addEventListener('beforeunload', saveToSession);
    return () => window.removeEventListener('beforeunload', saveToSession);
  }, [displayedAdsCount, displayedRevenueCount]);
  
  useEffect(() => {
    // System of animation with reasonable update intervals
    let animationFrameId: number;
    
    // Animation function with reduced frequency
    const updateAnimation = () => {
      animateCounters();
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    // Only start animation once counters are initialized
    if (countersInitialized) {
      // Start animation
      animationFrameId = requestAnimationFrame(updateAnimation);
      
      // Interval for periodic counter updates (target values)
      const updateInterval = setInterval(() => {
        incrementCountersRandomly();
      }, 300000 + Math.floor(Math.random() * 120000)); // Toutes les 5-7 minutes
      
      // Schedule reset at midnight
      const resetTimeout = scheduleCycleUpdate();
      
      return () => {
        if (resetTimeout) clearTimeout(resetTimeout);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        clearInterval(updateInterval);
      };
    }
  }, [
    animateCounters,
    incrementCountersRandomly,
    scheduleCycleUpdate,
    countersInitialized
  ]);
  
  // Save to both storage types whenever displayed values change
  useEffect(() => {
    if (!countersInitialized) return;
    
    // Ensure we never save values below our minimum thresholds
    const safeAdsCount = Math.max(MINIMUM_ADS_COUNT, displayedAdsCount);
    const safeRevenueCount = Math.max(MINIMUM_REVENUE_COUNT, displayedRevenueCount);
    
    // Get previous values to ensure we're not decreasing them
    const prevAdsCount = parseInt(localStorage.getItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT) || '0', 10);
    const prevRevenueCount = parseInt(localStorage.getItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT) || '0', 10);
    
    // Make sure we never go below our minimums or previous values
    const newAdsCount = Math.max(MINIMUM_ADS_COUNT, Math.max(prevAdsCount, Math.round(safeAdsCount)));
    const newRevenueCount = Math.max(MINIMUM_REVENUE_COUNT, Math.max(prevRevenueCount, Math.round(safeRevenueCount)));
    
    // Always update localStorage with the highest value
    localStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT, newAdsCount.toString());
    localStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, newRevenueCount.toString());
    
    // Also update sessionStorage for refresh protection
    sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_ADS_COUNT, newAdsCount.toString());
    sessionStorage.setItem(STORAGE_KEYS.DISPLAYED_REVENUE_COUNT, newRevenueCount.toString());
    
    // Update the sync date
    localStorage.setItem('stats_last_sync_date', new Date().toDateString());
    
    // If the stored value is higher than our current state, update the state too
    if (newAdsCount > safeAdsCount) {
      setDisplayedAdsCount(newAdsCount);
      setAdsCount(newAdsCount);
    }
    
    if (newRevenueCount > safeRevenueCount) {
      setDisplayedRevenueCount(newRevenueCount);
      setRevenueCount(newRevenueCount);
    }
  }, [
    displayedAdsCount, 
    displayedRevenueCount, 
    countersInitialized, 
    setDisplayedAdsCount, 
    setAdsCount, 
    setDisplayedRevenueCount, 
    setRevenueCount
  ]);

  return useMemo(() => ({
    // Ensure we never return values below minimums
    displayedAdsCount: Math.max(MINIMUM_ADS_COUNT, displayedAdsCount),
    displayedRevenueCount: Math.max(MINIMUM_REVENUE_COUNT, displayedRevenueCount)
  }), [displayedAdsCount, displayedRevenueCount]);
};
