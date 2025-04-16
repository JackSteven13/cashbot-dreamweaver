
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
  const [stableAdsCount, setStableAdsCount] = useState(() => {
    // Initialiser avec des valeurs minimales sûres pour éviter le flicker à 0
    const stored = localStorage.getItem('displayed_ads_count');
    return stored ? Math.max(40000, parseInt(stored, 10)) : 40000;
  });
  
  const [stableRevenueCount, setStableRevenueCount] = useState(() => {
    // Initialiser avec des valeurs minimales sûres pour éviter le flicker à 0
    const stored = localStorage.getItem('displayed_revenue_count');
    return stored ? Math.max(50000, parseInt(stored, 10)) : 50000;
  });
  
  const previousAdsCountRef = useRef(displayedAdsCount);
  const previousRevenueCountRef = useRef(displayedRevenueCount);
  
  // Protection pour éviter les valeurs à 0 au chargement initial
  useEffect(() => {
    // Si on a des valeurs à 0, restaurer les dernières valeurs connues
    if (displayedAdsCount === 0 || displayedRevenueCount === 0) {
      const lastAdsCount = localStorage.getItem('displayed_ads_count');
      const lastRevenueCount = localStorage.getItem('displayed_revenue_count');
      
      if (lastAdsCount) {
        const parsedAdsCount = parseInt(lastAdsCount, 10);
        if (!isNaN(parsedAdsCount) && parsedAdsCount > 0) {
          previousAdsCountRef.current = parsedAdsCount;
        }
      }
      
      if (lastRevenueCount) {
        const parsedRevenueCount = parseInt(lastRevenueCount, 10);
        if (!isNaN(parsedRevenueCount) && parsedRevenueCount > 0) {
          previousRevenueCountRef.current = parsedRevenueCount;
        }
      }
    }
  }, []);
  
  // Update stable values when displayed values change
  useEffect(() => {
    // Utiliser des valeurs minimales sûres pour éviter les baisses visuelles
    const safeAdsCount = Math.max(displayedAdsCount, 40000);
    const safeRevenueCount = Math.max(displayedRevenueCount, 50000);
    
    // Only update if the new value is higher than the previous stable value
    // This prevents any decreases in the displayed numbers
    if (safeAdsCount > stableAdsCount) {
      setStableAdsCount(safeAdsCount);
      previousAdsCountRef.current = safeAdsCount;
    }
    
    if (safeRevenueCount > stableRevenueCount) {
      setStableRevenueCount(safeRevenueCount);
      previousRevenueCountRef.current = safeRevenueCount;
    }
    
    // Store the values to avoid drops during refreshes
    localStorage.setItem('displayed_ads_count', Math.max(stableAdsCount, safeAdsCount).toString());
    localStorage.setItem('displayed_revenue_count', Math.max(stableRevenueCount, safeRevenueCount).toString());
    
    // If we detect a decrease, use the previous stable value
    if (safeAdsCount < previousAdsCountRef.current) {
      console.log('Preventing ads count decrease:', 
                  safeAdsCount, '->', previousAdsCountRef.current);
    }
    
    if (safeRevenueCount < previousRevenueCountRef.current) {
      console.log('Preventing revenue count decrease:', 
                  safeRevenueCount, '->', previousRevenueCountRef.current);
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
