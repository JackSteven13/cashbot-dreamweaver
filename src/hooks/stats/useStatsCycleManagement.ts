
import { useCallback } from 'react';
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

interface UseStatsCycleManagementParams {
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  // Schedule next cycle update at midnight Paris time
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilMidnight = calculateTimeUntilMidnight();
    
    // Convert to hours for the logs
    const hoursUntilMidnight = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesUntilMidnight = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    
    console.log(`Next counter reset scheduled in ${hoursUntilMidnight} hours and ${minutesUntilMidnight} minutes`);
    
    const resetTimeout = setTimeout(() => {
      // Reset counters at midnight Paris time
      setAdsCount(0);
      setRevenueCount(0);
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Schedule the next reset
      scheduleCycleUpdate();
    }, timeUntilMidnight);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Ultra-fast increments to show high-volume global operation
  const incrementCountersRandomly = useCallback(() => {
    // Updated calculations for very high frequency operation
    const secondsInDay = 24 * 60 * 60;
    // Extremely high multiplier for impressive progression
    const cycleMultiplier = 150; 
    const adsIncrementPerSecond = (dailyAdsTarget * cycleMultiplier) / secondsInDay;
    
    // Strong randomization for spectacular counter movement
    const randomFactor = Math.random() * 10 + 5; // Random between 5-15x
    
    // Massive increments per update for ads
    const adsIncrement = Math.ceil(adsIncrementPerSecond * randomFactor);
    
    setAdsCount(prevAdsCount => {
      // Only increments if we haven't reached the target
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      const newAdsCount = Math.min(prevAdsCount + adsIncrement, dailyAdsTarget);
      
      // Update revenue with EXTREMELY variable increments
      const adsDifference = newAdsCount - prevAdsCount;
      
      // Calculate average revenue per ad to meet target
      const avgRevenuePerAd = dailyRevenueTarget / dailyAdsTarget;
      
      // Each ad generates between 1€ and 25€
      let totalRevenueFromNewAds = 0;
      
      // Calculate revenue for each ad individually
      for (let i = 0; i < adsDifference; i++) {
        const adValueRoll = Math.random();
        let adRevenue;
        
        if (adValueRoll > 0.95) {
          // EXCEPTIONAL ads (20-25€ per ad)
          adRevenue = 20 + Math.random() * 5;
          if (i % 100 === 0) { // Log only occasionally to avoid flooding console
            console.log(`💎💎💎 JACKPOT: Exceptional ad worth ${Math.round(adRevenue)}€!`);
          }
        } else if (adValueRoll > 0.90) {
          // Premium ads (15-20€ per ad)
          adRevenue = 15 + Math.random() * 5;
          if (i % 100 === 0) {
            console.log(`💰💰 Premium ad worth ${Math.round(adRevenue)}€!`);
          }
        } else if (adValueRoll > 0.75) {
          // Very profitable ads (10-15€ per ad)
          adRevenue = 10 + Math.random() * 5;
          if (i % 200 === 0) {
            console.log(`💰 High-value ad: ${Math.round(adRevenue)}€`);
          }
        } else if (adValueRoll > 0.5) {
          // Profitable ads (5-10€ per ad)
          adRevenue = 5 + Math.random() * 5;
        } else if (adValueRoll > 0.3) {
          // Standard ads (3-5€ per ad)
          adRevenue = 3 + Math.random() * 2;
        } else {
          // Basic ads (1-3€ per ad)
          adRevenue = 1 + Math.random() * 2;
        }
        
        totalRevenueFromNewAds += adRevenue;
      }
      
      // Direct update of revenue based on new ads
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        return Math.min(prevRevenueCount + totalRevenueFromNewAds, dailyRevenueTarget);
      });
      
      return newAdsCount;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
