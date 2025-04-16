
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
    // Éviter les mises à jour trop fréquentes (au maximum toutes les 700ms)
    // Augmenter le délai pour un affichage plus progressif
    const now = Date.now();
    const updateDelayMs = 700;
    
    // Calculer l'écart pour déterminer si une mise à jour est nécessaire
    const adsDiff = Math.abs(displayedAdsCount - lastAdsValue.current);
    const revenueDiff = Math.abs(displayedRevenueCount - lastRevenueValue.current);
    
    // Définir des seuils minimum pour les mises à jour - valeurs plus élevées pour un changement plus lent
    const minimumAdsChangeThreshold = 50;
    const minimumRevenueChangeThreshold = 120;
    
    // Mise à jour des annonces si l'écart est significatif et si le délai minimum est passé
    if ((adsDiff > minimumAdsChangeThreshold) && (now - lastAdsUpdate.current > updateDelayMs)) {
      // Simulation de bursts d'activité par moments (comme si plusieurs bots finissaient leurs tâches en même temps)
      // Réduire la probabilité de burst et leur intensité
      const burstFactor = Math.random() > 0.92 ? 1.8 : 1.0; // Réduit de 2.5 à 1.8
      
      // Éviter les sauts: effectuer une transition douce vers la nouvelle valeur
      const currentNumeric = parseInt(displayedAds.replace(/\s/g, ''), 10) || 0;
      const targetValue = displayedAdsCount;
      
      // Limiter le changement à un pourcentage maximum pour éviter les sauts trop grands
      // Mais permettre occasionnellement des bursts plus importants
      // Réduire le changement maximal
      const maxChange = Math.max(100, Math.floor(currentNumeric * 0.006 * burstFactor)); // Réduit de 0.008 à 0.006
      
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
      // Réduire la probabilité de publicités premium
      const premiumAdBurst = Math.random() > 0.96; // Réduit de 0.92 à 0.96
      const burstFactor = premiumAdBurst ? 2.0 : 1.0; // Réduit de 3.0 à 2.0
      
      // Extraire la valeur numérique actuelle
      const currentRevenueString = displayedRevenue.replace(/[^\d.,]/g, '').replace(',', '.');
      const currentNumeric = parseFloat(currentRevenueString) || 0;
      const targetValue = displayedRevenueCount;
      
      // Limiter le changement avec possibilité de bursts pour les publicités premium
      // Réduire le changement maximal
      const maxChange = Math.max(150, Math.floor(currentNumeric * 0.005 * burstFactor)); // Réduit de 0.006 à 0.005
      
      let newValue;
      if (Math.abs(targetValue - currentNumeric) <= maxChange) {
        newValue = targetValue;
      } else if (targetValue > currentNumeric) {
        newValue = currentNumeric + maxChange;
      } else {
        newValue = currentNumeric - maxChange;
      }
      
      // Ajouter une variation non-linéaire pour simuler les différentes catégories de publicités
      // Réduire les variations
      if (premiumAdBurst) {
        // Simuler l'analyse d'un lot de publicités premium
        newValue += Math.random() * 30; // Réduit de 40 à 30
      } else if (Math.random() > 0.75) {
        // Publicités de valeur moyenne
        newValue += Math.random() * 10; // Réduit de 15 à 10
      }
      
      const formattedValue = formatRevenue(newValue);
      setDisplayedRevenue(formattedValue);
      lastRevenueUpdate.current = now;
      lastRevenueValue.current = newValue;
      
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
