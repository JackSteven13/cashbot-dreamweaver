
import { useEffect, useState, useRef } from 'react';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 65000,
  dailyRevenueTarget = 186000
}: StatsCounterProps) => {
  // Real counters tracking actual values
  const [adsCount, setAdsCount] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  
  // Displayed counters that will animate to the real values
  const [displayedAdsCount, setDisplayedAdsCount] = useState(0);
  const [displayedRevenueCount, setDisplayedRevenueCount] = useState(0);
  
  // Animation speed references
  const adsAnimationSpeedRef = useRef(1);
  const revenueAnimationSpeedRef = useRef(1);
  
  useEffect(() => {
    // Get current Paris time
    const getNowInParis = () => {
      const now = new Date();
      // Convert to Paris time (UTC+2 or UTC+1 depending on DST)
      const parisOffset = now.getTimezoneOffset();
      const parisTime = new Date(now.getTime() - parisOffset * 60000);
      return parisTime;
    };
    
    // Calculate progression within the current 14-day period (0 to 1)
    const getBiWeeklyProgress = () => {
      const parisTime = getNowInParis();
      const currentDay = parisTime.getDate();
      
      // Determine which 14-day period we're in
      let periodStartDay;
      if (currentDay < 15) {
        periodStartDay = 1;
      } else if (currentDay < 29) {
        periodStartDay = 15;
      } else {
        const lastDayOfMonth = new Date(parisTime.getFullYear(), parisTime.getMonth() + 1, 0).getDate();
        periodStartDay = 29;
        
        // If this is a short month and we don't have a day 29, use different logic
        if (periodStartDay > lastDayOfMonth) {
          // Adjust for months with less than 29 days
          const daysPassed = currentDay;
          const totalDaysInMonth = lastDayOfMonth;
          return daysPassed / totalDaysInMonth;
        }
      }
      
      // Calculate days passed in this period and seconds in the current day
      const daysPassed = currentDay - periodStartDay;
      const hours = parisTime.getHours();
      const minutes = parisTime.getMinutes();
      const seconds = parisTime.getSeconds();
      
      // Calculate total seconds elapsed in the 14-day period
      const secondsInDay = hours * 3600 + minutes * 60 + seconds;
      const totalElapsedSeconds = daysPassed * 86400 + secondsInDay;
      
      // Total seconds in a 14-day period
      const totalSecondsIn14Days = 14 * 86400;
      
      return Math.min(totalElapsedSeconds / totalSecondsIn14Days, 1);
    };
    
    // Set initial values based on time within 14-day period
    const initializeCounters = () => {
      const periodProgress = getBiWeeklyProgress();
      const currentAdsCount = Math.floor(periodProgress * dailyAdsTarget);
      const currentRevenueCount = Math.floor(periodProgress * dailyRevenueTarget);
      
      setAdsCount(currentAdsCount);
      setRevenueCount(currentRevenueCount);
      // Start animations from lower values for more dramatic effect
      setDisplayedAdsCount(Math.floor(currentAdsCount * 0.5));
      setDisplayedRevenueCount(Math.floor(currentRevenueCount * 0.5));
    };
    
    // Animate counters with randomized increments for more natural feel
    const animateCounters = () => {
      // Randomly adjust animation speeds occasionally for visual interest
      if (Math.random() < 0.1) {
        adsAnimationSpeedRef.current = 0.5 + Math.random() * 1.5;
        revenueAnimationSpeedRef.current = 0.5 + Math.random() * 1.5;
      }
      
      setDisplayedAdsCount(prev => {
        // Add random variations to increment speed
        const diff = adsCount - prev;
        if (diff <= 0) return prev;
        
        // Faster animation when further from target
        const increment = Math.ceil(Math.max(1, diff * 0.05 * adsAnimationSpeedRef.current));
        return Math.min(prev + increment, adsCount);
      });
      
      setDisplayedRevenueCount(prev => {
        const diff = revenueCount - prev;
        if (diff <= 0) return prev;
        
        // Faster animation when further from target
        const increment = Math.ceil(Math.max(1, diff * 0.05 * revenueAnimationSpeedRef.current));
        return Math.min(prev + increment, revenueCount);
      });
    };
    
    // Calculate time until next reset (1st, 15th, or 29th at midnight Paris time)
    const getTimeUntilNextReset = () => {
      const parisTime = getNowInParis();
      const currentDay = parisTime.getDate();
      const currentYear = parisTime.getFullYear();
      const currentMonth = parisTime.getMonth();
      
      let nextResetDate;
      
      if (currentDay < 15) {
        // Next reset is on the 15th
        nextResetDate = new Date(currentYear, currentMonth, 15);
      } else if (currentDay < 29) {
        // Next reset is on the 29th, but check if month has 29th
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        nextResetDate = new Date(currentYear, currentMonth, Math.min(29, lastDayOfMonth));
      } else {
        // Next reset is on the 1st of next month
        nextResetDate = new Date(currentYear, currentMonth + 1, 1);
      }
      
      // Set to midnight
      nextResetDate.setHours(0, 0, 0, 0);
      
      // If we're already past midnight, add a day
      if (parisTime.getHours() === 0 && parisTime.getMinutes() === 0 && 
          parisTime.getDate() === nextResetDate.getDate()) {
        nextResetDate.setDate(nextResetDate.getDate() + 1);
      }
      
      return nextResetDate.getTime() - parisTime.getTime();
    };
    
    // Schedule next cycle update
    const scheduleCycleUpdate = () => {
      const timeUntilNextReset = getTimeUntilNextReset();
      
      console.log(`Next counter reset scheduled in ${Math.floor(timeUntilNextReset / 1000 / 60)} minutes`);
      
      const resetTimeout = setTimeout(() => {
        // Reset counters
        setAdsCount(0);
        setRevenueCount(0);
        setDisplayedAdsCount(0);
        setDisplayedRevenueCount(0);
        
        // Schedule the next reset
        scheduleCycleUpdate();
      }, timeUntilNextReset);
      
      return resetTimeout;
    };
    
    // Initialize counters based on current time
    initializeCounters();
    
    // Start a more frequent cycle to randomly increase counters
    const incrementCountersRandomly = () => {
      // Simulate real-time activity with randomized increases
      setAdsCount(prev => {
        const randomIncrement = Math.floor(Math.random() * 10) + 3;
        const newValue = Math.min(prev + randomIncrement, dailyAdsTarget);
        return newValue;
      });
      
      setRevenueCount(prev => {
        const randomIncrement = Math.floor(Math.random() * 100) + 50;
        const newValue = Math.min(prev + randomIncrement, dailyRevenueTarget);
        return newValue;
      });
    };
    
    // Animation frame for smooth counter updates
    let animationFrameId: number;
    const updateAnimation = () => {
      animateCounters();
      animationFrameId = requestAnimationFrame(updateAnimation);
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(updateAnimation);
    
    // Schedule periodic real data updates (simulating real-time data)
    const activityInterval = setInterval(incrementCountersRandomly, 3000);
    
    // Schedule reset at the end of the 14-day cycle
    const resetTimeout = scheduleCycleUpdate();
    
    // Cleanup
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout);
      clearInterval(activityInterval);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
          {displayedAdsCount.toLocaleString('fr-FR')}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Publicités analysées</p>
      </div>
      <div className="glass-panel p-3 sm:p-6 rounded-xl text-center">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary truncate">
          {formatRevenue(displayedRevenueCount)}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Revenus générés</p>
      </div>
    </div>
  );
};

export default StatsCounter;
