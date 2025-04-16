
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
    // Utiliser les valeurs stockées dans localStorage au montage initial
    const storedAds = localStorage.getItem('displayed_ads_count');
    const storedRevenue = localStorage.getItem('displayed_revenue_count');
    
    if (storedAds) {
      setDisplayedAds(storedAds);
      lastAdsValue.current = parseInt(storedAds.replace(/\s/g, ''), 10) || 0;
    }
    
    if (storedRevenue) {
      setDisplayedRevenue(storedRevenue);
      lastRevenueValue.current = parseInt(storedRevenue.replace(/[^\d.,]/g, '').replace(',', '.'), 10) || 0;
    }
  }, []);
  
  useEffect(() => {
    // Pour éviter les valeurs négatives à l'affichage
    const safeDisplayedAdsCount = Math.max(0, displayedAdsCount);
    const safeDisplayedRevenueCount = Math.max(0, displayedRevenueCount);
    
    // Éviter les mises à jour trop fréquentes (au maximum toutes les 1500ms - augmenté pour ralentir encore)
    const now = Date.now();
    const updateDelayMs = 1500; // Augmenté de 1000ms à 1500ms
    
    // Calculer l'écart pour déterminer si une mise à jour est nécessaire
    const adsDiff = Math.abs(safeDisplayedAdsCount - lastAdsValue.current);
    const revenueDiff = Math.abs(safeDisplayedRevenueCount - lastRevenueValue.current);
    
    // Définir des seuils minimum pour les mises à jour - valeurs plus élevées pour un changement plus lent
    const minimumAdsChangeThreshold = 150; // Augmenté de 100 à 150
    const minimumRevenueChangeThreshold = 300; // Augmenté de 200 à 300
    
    // Mise à jour des annonces si l'écart est significatif et si le délai minimum est passé
    if ((adsDiff > minimumAdsChangeThreshold) && (now - lastAdsUpdate.current > updateDelayMs)) {
      // Simulation de bursts d'activité par moments (comme si plusieurs bots finissaient leurs tâches en même temps)
      // Réduire encore la probabilité de burst et leur intensité
      const burstFactor = Math.random() > 0.97 ? 1.2 : 1.0; // Réduit de 1.5 à 1.2, et probabilité de 0.95 à 0.97
      
      // Éviter les sauts: effectuer une transition douce vers la nouvelle valeur
      const currentNumeric = parseInt(displayedAds.replace(/\s/g, ''), 10) || 0;
      const targetValue = safeDisplayedAdsCount;
      
      // Limiter le changement à un pourcentage maximum pour éviter les sauts trop grands
      // Mais permettre occasionnellement des bursts plus importants
      // Réduire davantage le changement maximal
      const maxChange = Math.max(50, Math.floor(currentNumeric * 0.003 * burstFactor)); // Réduit de 0.004 à 0.003, minimum de 100 à 50
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = Math.max(0, currentNumeric - maxChange); // Assurer qu'on ne descend pas sous 0
      }
      
      // Ajouter une légère variation aléatoire (+/- 3 annonces au lieu de 5)
      newValue = Math.max(0, newValue + (Math.floor(Math.random() * 7) - 3));
      
      const formattedValue = Math.round(newValue).toLocaleString('fr-FR');
      setDisplayedAds(formattedValue);
      lastAdsUpdate.current = now;
      lastAdsValue.current = newValue;
      
      // Stocker la valeur affichée dans localStorage
      localStorage.setItem('displayed_ads_count', formattedValue);
    }
    
    // Même logique pour le revenu, mais avec des variations plus spécifiques pour simuler
    // différentes valeurs de publicités
    if ((revenueDiff > minimumRevenueChangeThreshold) && (now - lastRevenueUpdate.current > updateDelayMs)) {
      // Simuler différentes catégories de valeur de publicités
      // Parfois des publicités premium à haute valeur sont analysées (d'où les pics)
      // Réduire davantage la probabilité de publicités premium
      const premiumAdBurst = Math.random() > 0.985; // Réduit de 0.97 à 0.985
      const burstFactor = premiumAdBurst ? 1.5 : 1.0; // Réduit de 1.8 à 1.5
      
      // Extraire la valeur numérique actuelle
      const currentRevenueString = displayedRevenue.replace(/[^\d.,]/g, '').replace(',', '.');
      const currentNumeric = parseFloat(currentRevenueString) || 0;
      const targetValue = safeDisplayedRevenueCount;
      
      // Limiter le changement avec possibilité de bursts pour les publicités premium
      // Réduire davantage le changement maximal
      const maxChange = Math.max(75, Math.floor(currentNumeric * 0.003 * burstFactor)); // Réduit de 0.004 à 0.003, minimum de 150 à 75
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = Math.max(0, currentNumeric - maxChange); // Assurer qu'on ne descend pas sous 0
      }
      
      // Ajouter une variation non-linéaire pour simuler les différentes catégories de publicités
      // Réduire davantage les variations
      if (premiumAdBurst) {
        // Simuler l'analyse d'un lot de publicités premium
        newValue += Math.random() * 20; // Réduit de 25 à 20
      } else if (Math.random() > 0.85) {
        // Publicités de valeur moyenne (probabilité réduite de 0.75 à 0.85)
        newValue += Math.random() * 6; // Réduit de 8 à 6
      }
      
      const formattedValue = formatRevenue(Math.max(0, newValue)); // Assurer qu'on ne descend pas sous 0
      setDisplayedRevenue(formattedValue);
      lastRevenueUpdate.current = now;
      lastRevenueValue.current = Math.max(0, newValue);
      
      // Stocker la valeur affichée dans localStorage
      localStorage.setItem('displayed_revenue_count', formattedValue);
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
