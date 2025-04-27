
import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';

const StatisticsCounters: React.FC = memo(() => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  const CORRELATION_RATIO = 0.76203;

  // Use user ID to isolate statistics
  const { adsCount: baseAdsCount, revenueCount: baseRevenueCount } = usePersistentStats({
    autoIncrement: false,
    userId: userId || 'anonymous',
    forceGrowth: true,
    correlationRatio: CORRELATION_RATIO
  });

  // Local state for progression
  const [localAdsCount, setLocalAdsCount] = useState(0);
  const [localRevenueCount, setLocalRevenueCount] = useState(0);
  const intervalIdRef = useRef<number | null>(null);

  // Synchronize with base values when they change
  useEffect(() => {
    if (userId) {
      setLocalAdsCount(baseAdsCount);
      setLocalRevenueCount(baseRevenueCount);
    }
  }, [baseAdsCount, baseRevenueCount, userId]);

  // Memoize the interval generation to prevent recreating on each render
  const getUserSpecificRate = useCallback(() => {
    if (!userId) return 9500;
    // Use first character code as a stable seed for this user
    return (userId.charCodeAt(0) % 5 + 8) * 1000; // Between 8 and 12 seconds, based on user ID
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
      setLocalAdsCount(prev => {
        let adsIncrement = 0;
        const adsRand = Math.random();
        if (adsRand > 0.92) adsIncrement = 2;
        else if (adsRand > 0.70) adsIncrement = 1;
        return prev + adsIncrement;
      });
      
      setLocalRevenueCount(prevRev => {
        let revInc = 0;
        if (Math.random() > 0.82) {
          // Slight variation based on user ID so each user has a different pattern
          const userVariation = userId ? (userId.charCodeAt(0) % 10) / 100 : 0;
          revInc = (Math.random() * 1.7 + 0.25) * (CORRELATION_RATIO + ((Math.random() - 0.5) * 0.032) + userVariation);
        }
        return prevRev + revInc;
      });
    }, userSpecificRate + Math.floor(Math.random() * 5000));

    intervalIdRef.current = newIntervalId;
    
    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [userId, getUserSpecificRate]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-blue-900/10 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-300">
          <AnimatedNumber 
            value={userId ? localAdsCount : 0} 
            duration={300}
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
        </div>
        <p className="text-sm md:text-base mt-2 text-blue-800 dark:text-blue-400">Publicités analysées</p>
      </div>
      <div className="bg-emerald-900/10 dark:bg-emerald-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 dark:text-emerald-300">
          <AnimatedNumber 
            value={userId ? localRevenueCount : 0} 
            duration={300}
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
