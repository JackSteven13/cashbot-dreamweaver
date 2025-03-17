
import { useCallback } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
}

export const useStatsAnimation = ({
  adsCount,
  revenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount
}: UseStatsAnimationParams) => {
  // Animation dramatically improved for impressive numbers
  const animateCounters = useCallback(() => {
    // Update ad count with ultra-fast animation to show massive processing
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      // Much larger increments for dramatic visual effect
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.8), 300);
      return Math.min(prevCount + increment, adsCount);
    });

    // Update revenue count with HUGE and VERY VISIBLE jumps
    setDisplayedRevenueCount((prevCount) => {
      if (prevCount >= revenueCount) return revenueCount;
      
      // EXTREME random variation to simulate high-value ads
      const randomFactor = Math.random();
      let increment;
      
      if (randomFactor > 0.95) {
        // GIGANTIC rare jumps (25-40€ per ad)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.85), 4000);
        console.log("💎💎💎 ULTRA-PREMIUM AD: +4000€!");
      } else if (randomFactor > 0.85) {
        // Large occasional jumps (15-25€ per ad)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.75), 2500);
        console.log("💰💰 PREMIUM AD: +2500€!");
      } else if (randomFactor > 0.65) {
        // Medium frequent jumps (8-15€ per ad)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.65), 1500);
        console.log("💰 High-value ad: +1500€");
      } else if (randomFactor > 0.4) {
        // Small but still visible jumps (4-8€ per ad)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.5), 800);
      } else {
        // Standard increments (1-4€ per ad)
        increment = Math.max(Math.floor((revenueCount - prevCount) * 0.3), 400);
      }
      
      return Math.min(prevCount + increment, revenueCount);
    });

    // Return true to indicate animation is still active if either counter hasn't reached its target
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
