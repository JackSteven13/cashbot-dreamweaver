
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
    // Calculate revenue per ad with HIGH VARIANCE for impressive visual experience
    const baseRevenuePerAd = dailyRevenueTarget / dailyAdsTarget;
    
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
      
      // Simulate different ad values, with VERY SIGNIFICANT variations
      let revenueMultiplier;
      const valueRoll = Math.random();
      
      if (valueRoll > 0.97) {
        // EXCEPTIONAL ads (30-40€ per ad)
        revenueMultiplier = baseRevenuePerAd * (30 + Math.random() * 10);
        console.log("💎💎💎 JACKPOT: Exceptional ad worth 30-40€!");
      } else if (valueRoll > 0.90) {
        // Premium ads (20-30€ per ad)
        revenueMultiplier = baseRevenuePerAd * (20 + Math.random() * 10);
        console.log("💰💰 Premium ad worth 20-30€!");
      } else if (valueRoll > 0.75) {
        // Very profitable ads (10-20€ per ad)
        revenueMultiplier = baseRevenuePerAd * (10 + Math.random() * 10);
        console.log("💰 High-value ad: 10-20€");
      } else if (valueRoll > 0.5) {
        // Profitable ads (5-10€ per ad)
        revenueMultiplier = baseRevenuePerAd * (5 + Math.random() * 5);
      } else if (valueRoll > 0.3) {
        // Standard ads (3-5€ per ad)
        revenueMultiplier = baseRevenuePerAd * (3 + Math.random() * 2);
      } else {
        // Basic ads (1-3€ per ad)
        revenueMultiplier = baseRevenuePerAd * (1 + Math.random() * 2);
      }
      
      const revenueIncrement = adsDifference * revenueMultiplier;
      
      // Direct update of revenue based on new ads
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        return Math.min(prevRevenueCount + revenueIncrement, dailyRevenueTarget);
      });
      
      return newAdsCount;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
