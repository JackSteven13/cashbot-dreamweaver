
import React, { useEffect, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 850000, // Considérablement augmenté pour refléter plusieurs agents IA
  dailyRevenueTarget = 1750000 // Augmenté proportionnellement
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  // Référence pour éviter de trop rafraîchir l'interface utilisateur
  const lastUpdateRef = useRef({
    adsCount: 0,
    revenueCount: 0,
    timestamp: 0
  });
  
  // Valeurs formatées pour l'affichage
  const [displayedAds, setDisplayedAds] = React.useState("0");
  const [displayedRevenue, setDisplayedRevenue] = React.useState("0");
  
  // Mettre à jour l'affichage seulement si la différence est significative
  // ou si un certain temps s'est écoulé
  useEffect(() => {
    const now = Date.now();
    const timeDiff = now - lastUpdateRef.current.timestamp;
    const adsDiff = Math.abs(displayedAdsCount - lastUpdateRef.current.adsCount);
    const revenueDiff = Math.abs(displayedRevenueCount - lastUpdateRef.current.revenueCount);
    
    // Mettre à jour uniquement si:
    // - C'est la première mise à jour
    // - Au moins 1.5 secondes se sont écoulées depuis la dernière mise à jour
    // - La différence dans les annonces est d'au moins 100
    // - La différence dans les revenus est d'au moins 200
    if (
      lastUpdateRef.current.timestamp === 0 ||
      timeDiff > 1500 ||
      adsDiff > 100 ||
      revenueDiff > 200
    ) {
      setDisplayedAds(displayedAdsCount.toLocaleString('fr-FR'));
      setDisplayedRevenue(formatRevenue(displayedRevenueCount));
      
      lastUpdateRef.current = {
        adsCount: displayedAdsCount,
        revenueCount: displayedRevenueCount,
        timestamp: now
      };
    }
  }, [displayedAdsCount, displayedRevenueCount]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full max-w-lg mb-6 md:mb-8 animate-slide-up">
      <StatPanel 
        value={displayedAds}
        label="Publicités analysées"
      />
      <StatPanel 
        value={displayedRevenue}
        label="Revenus générés"
      />
    </div>
  );
};

export default StatsCounter;
