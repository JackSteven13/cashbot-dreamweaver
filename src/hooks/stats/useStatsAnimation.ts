
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
  // Animation improved for better readability
  const animateCounters = useCallback(() => {
    // Update ad count with smoother animation
    setDisplayedAdsCount((prevCount) => {
      if (prevCount >= adsCount) return adsCount;
      // Smaller increments for smoother animation
      const increment = Math.max(Math.floor((adsCount - prevCount) * 0.2), 50);
      const newAdsCount = Math.min(prevCount + increment, adsCount);
      
      // Only update revenue display when ads are updated
      if (newAdsCount > prevCount) {
        setDisplayedRevenueCount((prevRevCount) => {
          if (prevRevCount >= revenueCount) return revenueCount;
          
          // Calculate how much revenue should be shown based on new ads processed
          const adsProcessed = newAdsCount - prevCount;
          
          // Create smoother revenue jumps - each ad is worth between 1-25€
          const averageRevenuePerAd = 8; // Set average revenue per ad
          const totalRevenueIncrement = adsProcessed * averageRevenuePerAd;
          
          // Smoother animation with smaller increments
          const smoothIncrement = Math.min(
            totalRevenueIncrement,
            (revenueCount - prevRevCount) * 0.1
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
