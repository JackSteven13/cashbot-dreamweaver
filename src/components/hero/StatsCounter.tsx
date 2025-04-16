
import React, { useEffect, useState } from 'react';
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
  
  const [displayedAds, setDisplayedAds] = useState("0");
  const [displayedRevenue, setDisplayedRevenue] = useState("0");
  
  // Utiliser un effet distinct avec une dépendance de temps minime pour réduire
  // la fréquence des mises à jour et éviter des fluctuations excessives
  useEffect(() => {
    // Nouveau seuil pour éviter les mises à jour excessives
    const minimumChangeThreshold = 10; // Ne mettre à jour que si le changement est significatif
    const currentAdsNumeric = parseInt(displayedAds.replace(/\s/g, ''), 10) || 0;
    
    if (Math.abs(displayedAdsCount - currentAdsNumeric) > minimumChangeThreshold) {
      setDisplayedAds(Math.round(displayedAdsCount).toLocaleString('fr-FR'));
    }
    
    // Formater le revenu uniquement lors de changements significatifs
    const currentRevenueNumeric = parseFloat(displayedRevenue.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    if (Math.abs(displayedRevenueCount - currentRevenueNumeric) > minimumChangeThreshold * 2) {
      setDisplayedRevenue(formatRevenue(displayedRevenueCount));
    }
  }, [displayedAdsCount, displayedRevenueCount, displayedAds, displayedRevenue]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full max-w-lg mb-6 md:mb-8 animate-slide-up">
      <StatPanel 
        value={displayedAds}
        label="Publicités analysées"
        className="animate-none" 
      />
      <StatPanel 
        value={displayedRevenue}
        label="Revenus générés"
        className="animate-none"
      />
    </div>
  );
};

export default StatsCounter;
