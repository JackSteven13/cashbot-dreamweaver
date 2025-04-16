
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
    // Éviter les mises à jour trop fréquentes (au maximum toutes les 500ms)
    // Réduction du délai pour plus de réactivité mais avec des seuils
    const now = Date.now();
    const updateDelayMs = 500;
    
    // Calculer l'écart pour déterminer si une mise à jour est nécessaire
    const adsDiff = Math.abs(displayedAdsCount - lastAdsValue.current);
    const revenueDiff = Math.abs(displayedRevenueCount - lastRevenueValue.current);
    
    // Définir des seuils minimum pour les mises à jour - valeurs plus basses pour plus de réactivité
    const minimumAdsChangeThreshold = 30;
    const minimumRevenueChangeThreshold = 80;
    
    // Mise à jour des annonces si l'écart est significatif et si le délai minimum est passé
    if ((adsDiff > minimumAdsChangeThreshold) && (now - lastAdsUpdate.current > updateDelayMs)) {
      // Simulation de bursts d'activité par moments (comme si plusieurs bots finissaient leurs tâches en même temps)
      const burstFactor = Math.random() > 0.85 ? 2.5 : 1.0;
      
      // Éviter les sauts: effectuer une transition douce vers la nouvelle valeur
      const currentNumeric = parseInt(displayedAds.replace(/\s/g, ''), 10) || 0;
      const targetValue = displayedAdsCount;
      
      // Limiter le changement à un pourcentage maximum pour éviter les sauts trop grands
      // Mais permettre occasionnellement des bursts plus importants
      const maxChange = Math.max(120, Math.floor(currentNumeric * 0.008 * burstFactor));
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = currentNumeric - maxChange;
      }
      
      // Ajouter une légère variation aléatoire (+/- 5 annonces)
      newValue = newValue + (Math.floor(Math.random() * 11) - 5);
      
      setDisplayedAds(Math.round(newValue).toLocaleString('fr-FR'));
      lastAdsUpdate.current = now;
      lastAdsValue.current = newValue;
    }
    
    // Même logique pour le revenu, mais avec des variations plus spécifiques pour simuler
    // différentes valeurs de publicités
    if ((revenueDiff > minimumRevenueChangeThreshold) && (now - lastRevenueUpdate.current > updateDelayMs)) {
      // Simuler différentes catégories de valeur de publicités
      // Parfois des publicités premium à haute valeur sont analysées (d'où les pics)
      const premiumAdBurst = Math.random() > 0.92;
      const burstFactor = premiumAdBurst ? 3.0 : 1.0;
      
      // Extraire la valeur numérique actuelle
      const currentRevenueString = displayedRevenue.replace(/[^\d.,]/g, '').replace(',', '.');
      const currentNumeric = parseFloat(currentRevenueString) || 0;
      const targetValue = displayedRevenueCount;
      
      // Limiter le changement avec possibilité de bursts pour les publicités premium
      const maxChange = Math.max(180, Math.floor(currentNumeric * 0.006 * burstFactor));
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = currentNumeric - maxChange;
      }
      
      // Ajouter une variation non-linéaire pour simuler les différentes catégories de publicités
      if (premiumAdBurst) {
        // Simuler l'analyse d'un lot de publicités premium
        newValue += Math.random() * 40;
      } else if (Math.random() > 0.75) {
        // Publicités de valeur moyenne
        newValue += Math.random() * 15;
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
