
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
  
  const [displayedAds, setDisplayedAds] = useState("0");
  const [displayedRevenue, setDisplayedRevenue] = useState("0");
  
  // Références pour stocker les valeurs précédentes et contrôler les mises à jour
  const lastAdsUpdate = useRef<number>(0);
  const lastRevenueUpdate = useRef<number>(0);
  const lastAdsValue = useRef<number>(0);
  const lastRevenueValue = useRef<number>(0);
  
  useEffect(() => {
    // Éviter les mises à jour trop fréquentes (au maximum toutes les 800ms)
    const now = Date.now();
    const updateDelayMs = 800;
    
    // Calculer l'écart pour déterminer si une mise à jour est nécessaire
    const adsDiff = Math.abs(displayedAdsCount - lastAdsValue.current);
    const revenueDiff = Math.abs(displayedRevenueCount - lastRevenueValue.current);
    
    // Définir des seuils minimum pour les mises à jour
    const minimumAdsChangeThreshold = 50;
    const minimumRevenueChangeThreshold = 100;
    
    // Mise à jour des annonces si l'écart est significatif et si le délai minimum est passé
    if ((adsDiff > minimumAdsChangeThreshold) && (now - lastAdsUpdate.current > updateDelayMs)) {
      // Éviter les sauts: effectuer une transition douce vers la nouvelle valeur
      const currentNumeric = parseInt(displayedAds.replace(/\s/g, ''), 10) || 0;
      const targetValue = displayedAdsCount;
      
      // Limiter le changement à un pourcentage maximum pour éviter les sauts trop grands
      const maxChange = Math.max(100, Math.floor(currentNumeric * 0.005)); // 0.5% maximum ou 100 minimum
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = currentNumeric - maxChange;
      }
      
      setDisplayedAds(Math.round(newValue).toLocaleString('fr-FR'));
      lastAdsUpdate.current = now;
      lastAdsValue.current = newValue;
    }
    
    // Même logique pour le revenu
    if ((revenueDiff > minimumRevenueChangeThreshold) && (now - lastRevenueUpdate.current > updateDelayMs)) {
      // Extraire la valeur numérique actuelle
      const currentRevenueString = displayedRevenue.replace(/[^\d.,]/g, '').replace(',', '.');
      const currentNumeric = parseFloat(currentRevenueString) || 0;
      const targetValue = displayedRevenueCount;
      
      // Limiter le changement à un pourcentage maximum
      const maxChange = Math.max(200, Math.floor(currentNumeric * 0.005)); // 0.5% maximum ou 200 minimum
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = currentNumeric - maxChange;
      }
      
      setDisplayedRevenue(formatRevenue(newValue));
      lastRevenueUpdate.current = now;
      lastRevenueValue.current = newValue;
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
