
import React, { useEffect, useState, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 850000,
  dailyRevenueTarget = 1750000
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  const [displayedAds, setDisplayedAds] = useState("15,230");
  const [displayedRevenue, setDisplayedRevenue] = useState("18,450");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  const lastUpdateTime = useRef<number>(Date.now());
  const updateIntervalRef = useRef<number>(3000 + Math.random() * 2000);
  
  useEffect(() => {
    if (isFirstLoad) {
      // Attendre un peu avant de commencer les mises à jour
      setTimeout(() => setIsFirstLoad(false), 2000);
      return;
    }
    
    const updateValues = () => {
      const now = Date.now();
      if (now - lastUpdateTime.current < updateIntervalRef.current) {
        return;
      }
      
      // Générer de petites augmentations naturelles
      const currentAds = parseInt(displayedAds.replace(/,/g, ''));
      const currentRevenue = parseFloat(displayedRevenue.replace(/,/g, ''));
      
      // Augmentations variables mais toujours positives
      const adsIncrease = Math.floor(25 + Math.random() * 75);
      const revenueIncrease = Math.floor(50 + Math.random() * 150);
      
      const newAds = currentAds + adsIncrease;
      const newRevenue = currentRevenue + revenueIncrease;
      
      setDisplayedAds(newAds.toLocaleString('fr-FR'));
      setDisplayedRevenue(newRevenue.toLocaleString('fr-FR'));
      
      // Mettre à jour le timing pour la prochaine mise à jour
      lastUpdateTime.current = now;
      updateIntervalRef.current = 3000 + Math.random() * 2000; // 3-5 secondes
    };
    
    const intervalId = setInterval(updateValues, 1000);
    return () => clearInterval(intervalId);
  }, [isFirstLoad, displayedAds, displayedRevenue]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full max-w-lg mb-6 md:mb-8 animate-slide-up">
      <StatPanel 
        value={displayedAds}
        label="Publicités analysées"
        className="animate-pulse-slow" 
      />
      <StatPanel 
        value={displayedRevenue}
        label="Revenus générés"
        className="animate-pulse-slow"
      />
    </div>
  );
};

export default StatsCounter;
