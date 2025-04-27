
import { useEffect, useRef } from 'react';
import { incrementDateLinkedStats } from './utils/storageManager';

interface StatsAutoUpdateProps {
  adsCount: number;
  revenueCount: number;
  setAdsCount: (value: number) => void;
  setRevenueCount: (value: number) => void;
  animateCounters: (ads: number, revenue: number) => void;
}

export const useStatsAutoUpdate = ({
  adsCount,
  revenueCount,
  setAdsCount,
  setRevenueCount,
  animateCounters
}: StatsAutoUpdateProps) => {
  const countersInitializedRef = useRef(false);

  useEffect(() => {
    if (!countersInitializedRef.current) {
      countersInitializedRef.current = true;
      
      const initialTimeout = setTimeout(() => {
        const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
        
        setAdsCount(newAdsCount);
        setRevenueCount(newRevenueCount);
        animateCounters(newAdsCount, newRevenueCount);
      }, 30000);
      
      const incrementInterval = setInterval(() => {
        if (Math.random() > 0.4) {
          const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
          
          setAdsCount(newAdsCount);
          setRevenueCount(newRevenueCount);
          animateCounters(newAdsCount, newRevenueCount);
          
          try {
            localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
            localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
          } catch (e) {
            console.error("Failed to save displayed counts:", e);
          }
        }
      }, 300000);
      
      return () => {
        clearTimeout(initialTimeout);
        clearInterval(incrementInterval);
      };
    }
  }, [setAdsCount, setRevenueCount, animateCounters]);
};
