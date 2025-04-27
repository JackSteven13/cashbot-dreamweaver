
import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';

const StatisticsCounters: React.FC = memo(() => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  const CORRELATION_RATIO = 0.76203;
  
  // useRef for stable values between renders
  const valuesRef = useRef({
    adsCount: 0,
    revenueCount: 0,
  });

  // Use user ID to isolate statistics - prevent re-renders with usePersistentStats
  const { adsCount: baseAdsCount, revenueCount: baseRevenueCount } = usePersistentStats({
    autoIncrement: false,
    userId: userId || 'anonymous',
    forceGrowth: true,
    correlationRatio: CORRELATION_RATIO
  });

  // Local state for progression with stable initialization
  const [localAdsCount, setLocalAdsCount] = useState(() => baseAdsCount);
  const [localRevenueCount, setLocalRevenueCount] = useState(() => baseRevenueCount);
  const intervalIdRef = useRef<number | null>(null);
  const isUpdatingRef = useRef(false);

  // Track if component is mounted to prevent updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Synchronize with base values when they change - with debounce
  useEffect(() => {
    if (!userId || isUpdatingRef.current) return;
    
    if (Math.abs(baseAdsCount - valuesRef.current.adsCount) > 5 ||
        Math.abs(baseRevenueCount - valuesRef.current.revenueCount) > 5) {
        
      valuesRef.current = {
        adsCount: baseAdsCount,
        revenueCount: baseRevenueCount
      };
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLocalAdsCount(baseAdsCount);
        setLocalRevenueCount(baseRevenueCount);
      }
    }
  }, [baseAdsCount, baseRevenueCount, userId]);

  // Memoize the interval generation to prevent recreating on each render
  const getUserSpecificRate = useCallback(() => {
    if (!userId) return 12000;
    // Use first character code as a stable seed for this user
    const charCode = userId.charCodeAt(0) || 100;
    return (charCode % 5 + 10) * 1000; // Between 10 and 14 seconds
  }, [userId]);

  // Differentiated local progression by user with improved cleanup
  useEffect(() => {
    if (!userId) return;
    
    // Clear any existing interval to prevent multiple intervals
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    // Use a unique interval for each user
    const userSpecificRate = getUserSpecificRate();
    
    const newIntervalId = window.setInterval(() => {
      if (!isMountedRef.current) return;
      
      isUpdatingRef.current = true;
      
      setLocalAdsCount(prev => {
        let adsIncrement = 0;
        const adsRand = Math.random();
        if (adsRand > 0.94) adsIncrement = 1;
        return prev + adsIncrement;
      });
      
      setLocalRevenueCount(prevRev => {
        let revInc = 0;
        if (Math.random() > 0.85) {
          const userVariation = userId ? (userId.charCodeAt(0) % 10) / 200 : 0;
          revInc = (Math.random() * 1.2 + 0.2) * (CORRELATION_RATIO + ((Math.random() - 0.5) * 0.02) + userVariation);
        }
        return prevRev + revInc;
      });
      
      isUpdatingRef.current = false;
    }, userSpecificRate + Math.floor(Math.random() * 2000));

    intervalIdRef.current = newIntervalId;
    
    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [userId, getUserSpecificRate, CORRELATION_RATIO]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-blue-900/10 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-300">
          <AnimatedNumber 
            value={userId ? localAdsCount : 0} 
            duration={500}
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
        </div>
        <p className="text-sm md:text-base mt-2 text-blue-800 dark:text-blue-400">Publicités analysées</p>
      </div>
      <div className="bg-emerald-900/10 dark:bg-emerald-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 dark:text-emerald-300">
          <AnimatedNumber 
            value={userId ? localRevenueCount : 0} 
            duration={500}
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
          <span className="ml-1">€</span>
        </div>
        <p className="text-sm md:text-base mt-2 text-emerald-800 dark:text-emerald-400">Revenus générés</p>
      </div>
    </div>
  );
});

StatisticsCounters.displayName = 'StatisticsCounters';
export default StatisticsCounters;
