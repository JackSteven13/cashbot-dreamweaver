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
  
  // Much more controlled increments for stable visualization
  const incrementCountersRandomly = useCallback(() => {
    // Updated calculations for more stable progression
    const secondsInDay = 24 * 60 * 60;
    // Smaller multiplier for more stable progression
    const cycleMultiplier = 30; 
    const adsIncrementPerSecond = (dailyAdsTarget * cycleMultiplier) / secondsInDay;
    
    // Very limited randomization for more readable counter movement
    const randomFactor = Math.random() * 2 + 1; // Random between 1-3x
    
    // Smaller increments per update for ads
    const adsIncrement = Math.ceil(adsIncrementPerSecond * randomFactor);
    
    setAdsCount(prevAdsCount => {
      // Only increments if we haven't reached the target
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      const newAdsCount = Math.min(prevAdsCount + adsIncrement, dailyAdsTarget);
      
      // Update revenue with more predictable increments
      const adsDifference = newAdsCount - prevAdsCount;
      
      // Calculate revenue for these new ads
      let totalRevenueFromNewAds = 0;
      
      // Calculate revenue for each ad with more balanced distribution
      for (let i = 0; i < adsDifference; i++) {
        const adValueRoll = Math.random();
        let adRevenue;
        
        if (adValueRoll > 0.95) {
          // EXCEPTIONAL ads (20-25€ per ad) - less frequent
          adRevenue = 20 + Math.random() * 5;
          if (i % 1000 === 0) { // Log much less frequently
            console.log(`💎💎💎 JACKPOT: Exceptional ad worth ${Math.round(adRevenue)}€!`);
          }
        } else if (adValueRoll > 0.85) {
          // Premium ads (15-20€ per ad)
          adRevenue = 15 + Math.random() * 5;
          if (i % 1000 === 0) {
            console.log(`💰💰 Premium ad worth ${Math.round(adRevenue)}€!`);
          }
        } else if (adValueRoll > 0.70) {
          // High-value ads (10-15€ per ad)
          adRevenue = 10 + Math.random() * 5;
          if (i % 1500 === 0) {
            console.log(`💰 High-value ad: ${Math.round(adRevenue)}€`);
          }
        } else if (adValueRoll > 0.40) {
          // Medium-value ads (5-10€ per ad)
          adRevenue = 5 + Math.random() * 5;
        } else {
          // Standard ads (1-5€ per ad) - most common
          adRevenue = 1 + Math.random() * 4;
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
