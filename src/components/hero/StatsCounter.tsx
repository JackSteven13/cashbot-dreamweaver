
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
  const isInitialLoad = useRef<boolean>(true);
  
  // Effet d'initialisation - charger les valeurs dès le début sans attendre
  useEffect(() => {
    if (isInitialLoad.current) {
      // Utiliser les valeurs stockées dans localStorage au montage initial
      const storedAds = localStorage.getItem('global_ads_count') || 
                        localStorage.getItem('displayed_ads_count') || 
                        localStorage.getItem('stats_ads_count');
      
      const storedRevenue = localStorage.getItem('global_revenue_count') || 
                            localStorage.getItem('displayed_revenue_count') || 
                            localStorage.getItem('stats_revenue_count');
      
      if (storedAds) {
        const formattedAds = parseInt(storedAds.replace(/\s/g, ''), 10).toLocaleString('fr-FR');
        setDisplayedAds(formattedAds);
        lastAdsValue.current = parseInt(storedAds, 10) || 0;
      }
      
      if (storedRevenue) {
        const numericValue = parseInt(storedRevenue, 10) || 0;
        const formattedRevenue = formatRevenue(numericValue);
        setDisplayedRevenue(formattedRevenue);
        lastRevenueValue.current = numericValue;
      }
      
      isInitialLoad.current = false;
    }
  }, []);
  
  useEffect(() => {
    // Pour éviter les valeurs négatives à l'affichage
    const safeDisplayedAdsCount = Math.max(0, displayedAdsCount);
    const safeDisplayedRevenueCount = Math.max(0, displayedRevenueCount);
    
    // Éviter les mises à jour trop fréquentes (au maximum toutes les 2000ms)
    const now = Date.now();
    const updateDelayMs = 2000; // Augmenté à 2000ms pour un rythme plus lent
    
    // Calculer l'écart pour déterminer si une mise à jour est nécessaire
    const adsDiff = Math.abs(safeDisplayedAdsCount - lastAdsValue.current);
    const revenueDiff = Math.abs(safeDisplayedRevenueCount - lastRevenueValue.current);
    
    // Définir des seuils minimum pour les mises à jour - valeurs plus élevées pour un changement plus lent
    const minimumAdsChangeThreshold = 200; // Augmenté de 150 à 200
    const minimumRevenueChangeThreshold = 400; // Augmenté de 300 à 400
    
    // Mise à jour des annonces si l'écart est significatif et si le délai minimum est passé
    if ((adsDiff > minimumAdsChangeThreshold) && (now - lastAdsUpdate.current > updateDelayMs)) {
      // Simulation de bursts d'activité par moments (comme si plusieurs bots finissaient leurs tâches en même temps)
      // Réduire la probabilité de burst et leur intensité
      const burstFactor = Math.random() > 0.98 ? 1.15 : 1.0; // Réduit de 1.2 à 1.15, et probabilité de 0.97 à 0.98
      
      // Éviter les sauts: effectuer une transition douce vers la nouvelle valeur
      const currentNumeric = parseInt(displayedAds.replace(/\s/g, ''), 10) || 0;
      const targetValue = safeDisplayedAdsCount;
      
      // Limiter le changement à un pourcentage maximum pour éviter les sauts trop grands
      // Mais permettre occasionnellement des bursts plus importants
      // Réduire le changement maximal
      const maxChange = Math.max(30, Math.floor(currentNumeric * 0.002 * burstFactor)); // Réduit de 0.003 à 0.002, minimum de 50 à 30
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = Math.max(0, currentNumeric - maxChange); // Assurer qu'on ne descend pas sous 0
      }
      
      // Ajouter une légère variation aléatoire (+/- 2 annonces au lieu de 3)
      newValue = Math.max(0, newValue + (Math.floor(Math.random() * 5) - 2));
      
      const formattedValue = Math.round(newValue).toLocaleString('fr-FR');
      setDisplayedAds(formattedValue);
      lastAdsUpdate.current = now;
      lastAdsValue.current = newValue;
      
      // Stocker la valeur affichée dans localStorage
      localStorage.setItem('displayed_ads_count', newValue.toString());
    }
    
    // Même logique pour le revenu, mais avec des variations plus spécifiques pour simuler
    // différentes valeurs de publicités
    if ((revenueDiff > minimumRevenueChangeThreshold) && (now - lastRevenueUpdate.current > updateDelayMs)) {
      // Simuler différentes catégories de valeur de publicités
      // Parfois des publicités premium à haute valeur sont analysées (d'où les pics)
      // Réduire la probabilité de publicités premium
      const premiumAdBurst = Math.random() > 0.988; // Réduit de 0.985 à 0.988
      const burstFactor = premiumAdBurst ? 1.3 : 1.0; // Réduit de 1.5 à 1.3
      
      // Extraire la valeur numérique actuelle
      const currentRevenueString = displayedRevenue.replace(/[^\d.,]/g, '').replace(',', '.');
      const currentNumeric = parseFloat(currentRevenueString) || 0;
      const targetValue = safeDisplayedRevenueCount;
      
      // Limiter le changement avec possibilité de bursts pour les publicités premium
      // Réduire le changement maximal
      const maxChange = Math.max(50, Math.floor(currentNumeric * 0.002 * burstFactor)); // Réduit de 0.003 à 0.002, minimum de 75 à 50
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = Math.max(0, currentNumeric - maxChange); // Assurer qu'on ne descend pas sous 0
      }
      
      // Ajouter une variation non-linéaire pour simuler les différentes catégories de publicités
      // Réduire les variations
      if (premiumAdBurst) {
        // Simuler l'analyse d'un lot de publicités premium
        newValue += Math.random() * 15; // Réduit de 20 à 15
      } else if (Math.random() > 0.88) {
        // Publicités de valeur moyenne (probabilité réduite de 0.85 à 0.88)
        newValue += Math.random() * 4; // Réduit de 6 à 4
      }
      
      const formattedValue = formatRevenue(Math.max(0, newValue)); // Assurer qu'on ne descend pas sous 0
      setDisplayedRevenue(formattedValue);
      lastRevenueUpdate.current = now;
      lastRevenueValue.current = Math.max(0, newValue);
      
      // Stocker la valeur affichée dans localStorage
      localStorage.setItem('displayed_revenue_count', Math.round(newValue).toString());
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
