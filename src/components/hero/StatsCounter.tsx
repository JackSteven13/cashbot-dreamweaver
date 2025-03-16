
import { useEffect, useState } from 'react';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 30000,
  dailyRevenueTarget = 100000
}: StatsCounterProps) => {
  const [adsCount, setAdsCount] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  
  useEffect(() => {
    // Get current Paris time
    const getNowInParis = () => {
      const now = new Date();
      // Convert to Paris time (UTC+2 or UTC+1 depending on DST)
      const parisOffset = now.getTimezoneOffset();
      const parisTime = new Date(now.getTime() - parisOffset * 60000);
      return parisTime;
    };
    
    // Calculate progress of the day (0 to 1) in Paris time
    const getDayProgress = () => {
      const parisTime = getNowInParis();
      const hours = parisTime.getHours();
      const minutes = parisTime.getMinutes();
      const seconds = parisTime.getSeconds();
      
      // Calculate seconds elapsed since midnight
      const secondsElapsed = hours * 3600 + minutes * 60 + seconds;
      // Total seconds in a day
      const totalSecondsInDay = 24 * 3600;
      
      return secondsElapsed / totalSecondsInDay;
    };
    
    // Set initial values based on time of day
    const initializeCounters = () => {
      const dayProgress = getDayProgress();
      const currentAdsCount = Math.floor(dayProgress * dailyAdsTarget);
      const currentRevenueCount = Math.floor(dayProgress * dailyRevenueTarget);
      
      setAdsCount(currentAdsCount);
      setRevenueCount(currentRevenueCount);
    };
    
    // Calculate time until midnight in Paris
    const getTimeUntilMidnightParis = () => {
      const parisTime = getNowInParis();
      const tomorrow = new Date(parisTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return tomorrow.getTime() - parisTime.getTime();
    };
    
    // Schedule reset at midnight Paris time
    const scheduleReset = () => {
      const timeUntilMidnight = getTimeUntilMidnightParis();
      
      console.log(`Next reset scheduled in ${Math.floor(timeUntilMidnight / 1000 / 60)} minutes`);
      
      const resetTimeout = setTimeout(() => {
        // Reset counters
        setAdsCount(0);
        setRevenueCount(0);
        
        // Schedule the next reset
        scheduleReset();
      }, timeUntilMidnight);
      
      return resetTimeout;
    };
    
    // Start continuous increment after initial values are set
    const startIncrements = () => {
      // Calculate remaining ads and revenue to hit target by end of day
      const dayProgress = getDayProgress();
      const remainingDayPercentage = 1 - dayProgress;
      
      if (remainingDayPercentage <= 0) return null; // It's midnight exactly
      
      const remainingAds = dailyAdsTarget - adsCount;
      const remainingRevenue = dailyRevenueTarget - revenueCount;
      
      // Calculate interval timings to spread increments evenly across remaining time
      const remainingTimeInMs = remainingDayPercentage * 24 * 60 * 60 * 1000;
      
      // Aim for approximately 1 ad increment every 2-3 seconds on average
      const adIncrementInterval = Math.max(2000, remainingTimeInMs / (remainingAds / 5));
      
      // Aim for approximately 1 revenue increment every 4-5 seconds on average
      const revenueIncrementInterval = Math.max(4000, remainingTimeInMs / (remainingRevenue / 50));
      
      // Add between 3-8 ads randomly
      const adsInterval = setInterval(() => {
        const increment = Math.floor(Math.random() * 6) + 3;
        setAdsCount(prev => Math.min(prev + increment, dailyAdsTarget));
      }, adIncrementInterval);
      
      // Add between €30-80 randomly
      const revenueInterval = setInterval(() => {
        const increment = Math.floor(Math.random() * 51) + 30;
        setRevenueCount(prev => Math.min(prev + increment, dailyRevenueTarget));
      }, revenueIncrementInterval);
      
      return { adsInterval, revenueInterval };
    };
    
    // Initialize counters based on time of day in Paris
    initializeCounters();
    
    // Start increments
    const incrementIntervals = startIncrements();
    
    // Schedule midnight reset
    const resetTimeout = scheduleReset();
    
    // Cleanup
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      if (incrementIntervals) {
        clearInterval(incrementIntervals.adsInterval);
        clearInterval(incrementIntervals.revenueInterval);
      }
    };
  }, [dailyAdsTarget, dailyRevenueTarget]);

  // Format revenue with correct spacing for thousands and € symbol at the end
  const formatRevenue = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full max-w-lg mb-6 md:mb-8 animate-slide-up">
      <div className="glass-panel p-3 sm:p-6 rounded-xl text-center">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary truncate">
          {adsCount.toLocaleString('fr-FR')}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Publicités analysées</p>
      </div>
      <div className="glass-panel p-3 sm:p-6 rounded-xl text-center">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary truncate">
          {formatRevenue(revenueCount)}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Revenus générés</p>
      </div>
    </div>
  );
};

export default StatsCounter;
