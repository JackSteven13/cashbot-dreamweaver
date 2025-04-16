
import React, { useEffect, useRef, useState } from 'react';
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
  
  const lastUpdateRef = useRef({
    adsCount: 0,
    revenueCount: 0,
    timestamp: 0
  });
  
  const [displayedAds, setDisplayedAds] = useState("0");
  const [displayedRevenue, setDisplayedRevenue] = useState("0");
  
  useEffect(() => {
    const now = Date.now();
    const timeDiff = now - lastUpdateRef.current.timestamp;
    
    // Seuil minimal de différence pour mettre à jour l'affichage
    // Différences importantes requises et intervalles très longs
    const minAdsDiff = 50;  // Au moins 50 annonces de différence
    const minRevenueDiff = 100;  // Au moins 100€ de différence
    const minTimeDiff = 15000;  // Au moins 15 secondes
    
    const adsDiff = Math.abs(displayedAdsCount - lastUpdateRef.current.adsCount);
    const revenueDiff = Math.abs(displayedRevenueCount - lastUpdateRef.current.revenueCount);
    
    // Ne mettre à jour l'affichage que si:
    // - C'est la première fois (timestamp = 0)
    // - Ou si assez de temps s'est écoulé ET une différence significative existe
    if (lastUpdateRef.current.timestamp === 0 || 
        (timeDiff > minTimeDiff && (adsDiff > minAdsDiff || revenueDiff > minRevenueDiff))) {
      
      // Mise à jour progressive des valeurs affichées
      setDisplayedAds(displayedAdsCount.toLocaleString('fr-FR'));
      setDisplayedRevenue(formatRevenue(displayedRevenueCount));
      
      // Mettre à jour les références pour la prochaine comparaison
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
        className="animate-none" // Supprimer l'animation pulse qui peut être distrayante
      />
      <StatPanel 
        value={displayedRevenue}
        label="Revenus générés"
        className="animate-none" // Supprimer l'animation pulse qui peut être distrayante
      />
    </div>
  );
};

export default StatsCounter;
