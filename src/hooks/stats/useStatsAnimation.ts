
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
  // Animation drastically slowed down for better readability
  const animateCounters = useCallback(() => {
    // Update ad count with extremely slower animation
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      
      // Much smaller increments for very readable animation
      // Only increment by maximum 1% of the difference to make it much more readable
      const increment = Math.max(Math.ceil((adsCount - prevCount) * 0.01), 1);
      const newAdsCount = Math.min(prevCount + increment, adsCount);
      
      // Only update revenue display when ads are updated
      if (newAdsCount > prevCount) {
        setDisplayedRevenueCount((prevRevCount) => {
          if (prevRevCount >= revenueCount) return revenueCount;
          
          // Calculate how much revenue should be shown based on new ads processed
          const adsProcessed = newAdsCount - prevCount;
          
          // Stable revenue calculation - each ad is worth between 1-25€ on average
          const averageRevenuePerAd = 10; // Set average revenue per ad
          const totalRevenueIncrement = adsProcessed * averageRevenuePerAd;
          
          // Use an extremely small increment for stable display
          const smoothIncrement = Math.min(
            totalRevenueIncrement,
            (revenueCount - prevRevCount) * 0.01
          );
          
          return Math.min(prevRevCount + smoothIncrement, revenueCount);
        });
      }
      
      return newAdsCount;
    });

    // Return true to indicate animation is still active if either counter hasn't reached its target
    return { 
      animationActive: adsCount > 0 || revenueCount > 0 
    };
  }, [adsCount, revenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return { animateCounters };
};
