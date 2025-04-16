
import React, { useEffect, useState, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 28800, // ~1800 videos/hour × 16 hours = more realistic daily target
  dailyRevenueTarget = 40000 // ~1.5€ average per video × 28,800 videos
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  // Local state to prevent flickering or unexpected drops
  const [stableAdsCount, setStableAdsCount] = useState(displayedAdsCount);
  const [stableRevenueCount, setStableRevenueCount] = useState(displayedRevenueCount);
  const previousAdsCountRef = useRef(displayedAdsCount);
  const previousRevenueCountRef = useRef(displayedRevenueCount);
  
  // Update stable values when displayed values increase
  useEffect(() => {
    // Only update if the new value is higher than the previous stable value
    // This prevents any decreases in the displayed numbers
    if (displayedAdsCount > stableAdsCount) {
      setStableAdsCount(displayedAdsCount);
      previousAdsCountRef.current = displayedAdsCount;
    }
    
    if (displayedRevenueCount > stableRevenueCount) {
      setStableRevenueCount(displayedRevenueCount);
      previousRevenueCountRef.current = displayedRevenueCount;
    }
    
    // If we detect a decrease, use the previous stable value
    if (displayedAdsCount < previousAdsCountRef.current) {
      console.log('Preventing ads count decrease:', 
                  displayedAdsCount, '->', previousAdsCountRef.current);
    }
    
    if (displayedRevenueCount < previousRevenueCountRef.current) {
      console.log('Preventing revenue count decrease:', 
                  displayedRevenueCount, '->', previousRevenueCountRef.current);
    }
  }, [displayedAdsCount, displayedRevenueCount, stableAdsCount, stableRevenueCount]);
  
  // Forcer une mise à jour des compteurs plus fréquemment pour une animation fluide
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Forcer une mise à jour par changement d'état local
      const event = new CustomEvent('stats:update');
      window.dispatchEvent(event);
    }, 3000); // Toutes les 3 secondes pour une animation plus naturelle

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-4 md:mb-6">
      <StatPanel 
        value={stableAdsCount.toLocaleString('fr-FR')}
        label="Publicités analysées"
        className="text-sm animate-pulse-slow" 
      />
      <StatPanel 
        value={formatRevenue(stableRevenueCount)}
        label="Revenus générés"
        className="text-sm animate-pulse-slow" 
      />
    </div>
  );
};

export default StatsCounter;
