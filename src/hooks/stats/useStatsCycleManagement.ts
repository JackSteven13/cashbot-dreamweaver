
import { useState, useCallback, useEffect } from 'react';
import { activeLocations } from './data/locationData';
import { calculateRevenueForLocation } from './utils/revenueCalculator';
import { scheduleMidnightReset } from './utils/cycleManager';
import { getTotalHourlyRate } from './utils/hourlyRates';
import { calculateBurstActivity } from './utils/burstActivity';

interface UseStatsCycleManagementParams {
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

// Clés pour le stockage local
const STORAGE_KEYS = {
  LAST_UPDATE_TIME: 'stats_last_update_time'
};

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  // Charger le dernier temps de mise à jour depuis localStorage ou utiliser le temps actuel
  const initialLastUpdateTime = (() => {
    const storedTime = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE_TIME);
    return storedTime ? parseInt(storedTime, 10) : Date.now();
  })();
  
  const [lastUpdateTime, setLastUpdateTime] = useState(initialLastUpdateTime);
  // Track pause periods for more natural progression
  const [isPaused, setIsPaused] = useState(false);
  
  // Force periodic updates for displayed values
  useEffect(() => {
    // Mis à jour des compteurs visible toutes les 90 à 120 secondes
    const interval = setInterval(() => {
      incrementCountersRandomly();
    }, 90000 + Math.random() * 30000); // 90-120 secondes
    
    return () => clearInterval(interval);
  }, []);

  const incrementCountersRandomly = useCallback(() => {
    // Périodes de pause naturelles - 5% de chance de mettre en pause les mises à jour
    if (Math.random() < 0.05 && !isPaused) {
      setIsPaused(true);
      console.log("Natural pause in counter updates");
      
      // Planifier la fin de la période de pause
      setTimeout(() => {
        setIsPaused(false);
        console.log("Resuming counter updates after pause");
      }, 60000 + Math.random() * 60000); // 1-2 minutes de pause
      
      return; // Sauter cette mise à jour
    }
    
    // Sauter la mise à jour si en période de pause
    if (isPaused) {
      return;
    }
    
    const now = Date.now();
    const timeDiff = now - lastUpdateTime;
    
    // Sauvegarder le dernier temps de mise à jour dans localStorage
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, now.toString());
    
    // Utiliser un taux horaire plus actif pour les mises à jour
    const baseHourlyRate = getTotalHourlyRate(activeLocations) * 0.08; // Augmenté de 5% à 8%
    
    // Calculer la progression basée sur le temps avec un ralentissement naturel
    let totalAdsIncrement = Math.floor((baseHourlyRate * timeDiff) / (3600 * 1000));
    
    // Ajouter une variation naturelle selon l'heure de la journée
    const hourOfDay = new Date().getHours();
    let timeOfDayFactor = 1.0;
    
    if (hourOfDay < 6) {
      // Nuit (minuit-6h): très lent
      timeOfDayFactor = 0.2 + Math.random() * 0.15; // 20-35% de la vitesse (augmenté)
    } else if (hourOfDay < 9) {
      // Début de matinée (6h-9h): en progression 
      timeOfDayFactor = 0.4 + Math.random() * 0.2; // 40-60% de la vitesse (augmenté)
    } else if (hourOfDay < 12) {
      // Matinée (9h-midi): normal
      timeOfDayFactor = 0.6 + Math.random() * 0.3; // 60-90% de la vitesse (augmenté)
    } else if (hourOfDay < 15) {
      // Début d'après-midi (midi-15h): activité de pointe
      timeOfDayFactor = 0.9 + Math.random() * 0.3; // 90-120% de la vitesse (augmenté)
    } else if (hourOfDay < 20) {
      // Fin d'après-midi/soirée (15h-20h): activité soutenue
      timeOfDayFactor = 0.8 + Math.random() * 0.2; // 80-100% de la vitesse (augmenté)
    } else {
      // Nuit (20h-minuit): ralentissement
      timeOfDayFactor = 0.4 + Math.random() * 0.2; // 40-60% de la vitesse (augmenté)
    }
    
    // Appliquer le facteur d'heure de la journée
    totalAdsIncrement = Math.floor(totalAdsIncrement * timeOfDayFactor);
    
    // Périodes occasionnelles très lentes (comme la maintenance du système ou une faible activité)
    if (Math.random() < 0.03) { // 3% de chance
      totalAdsIncrement = Math.floor(totalAdsIncrement * (0.2 + Math.random() * 0.3)); // 20-50% de la vitesse (augmenté)
    }
    
    let totalRevenue = 0;
    
    // Distribuer les annonces entre les emplacements et calculer les revenus
    activeLocations.forEach(location => {
      const locationShare = location.weight / activeLocations.reduce((sum, loc) => sum + loc.weight, 0);
      const locationAds = Math.floor(totalAdsIncrement * locationShare);
      
      // Réduire la probabilité et l'impact des pics de 90%
      const burst = calculateBurstActivity(location);
      const finalAds = burst ? Math.floor(locationAds * (1 + (burst.multiplier - 1) * 0.2)) : locationAds; // Augmenté de 0.1 à 0.2
      
      totalRevenue += calculateRevenueForLocation(location, finalAds);
    });
    
    // Limitation de la croissance par mise à jour - augmentée par rapport à avant
    // Max 0.04% de l'objectif quotidien (doublé)
    const maxAdsPerUpdate = Math.min(200, Math.ceil(dailyAdsTarget * 0.0004)); // Doublé
    const maxRevenuePerUpdate = Math.min(400, Math.ceil(dailyRevenueTarget * 0.0004)); // Doublé
    
    const finalAdsIncrement = Math.min(totalAdsIncrement, maxAdsPerUpdate);
    const finalRevenueIncrement = Math.min(totalRevenue, maxRevenuePerUpdate);
    
    // Ajouter une variabilité naturelle - parfois les publicités augmentent plus vite que les revenus ou vice versa
    const adjustedRevenueIncrement = Math.floor(finalRevenueIncrement * (0.9 + Math.random() * 0.2));
    
    // S'assurer que les compteurs ne descendent jamais en dessous de zéro
    setAdsCount(prev => Math.max(0, prev + finalAdsIncrement));
    setRevenueCount(prev => Math.max(0, prev + adjustedRevenueIncrement));
    setLastUpdateTime(now);
    
    // Augmenter la probabilité de mises à jour visibles mineures
    if (Math.random() < 0.4) { // 40% de chance (augmenté de 20% à 40%)
      const smallVisibleAdsUpdate = Math.floor(finalAdsIncrement * 0.1); // Augmenté de 5% à 10%
      const smallVisibleRevenueUpdate = Math.floor(adjustedRevenueIncrement * 0.1); // Augmenté de 5% à 10%
      
      // Appliquer de petites mises à jour directes aux valeurs affichées pour une sensation plus naturelle de progression
      setDisplayedAdsCount(prev => Math.max(0, prev + smallVisibleAdsUpdate));
      setDisplayedRevenueCount(prev => Math.max(0, prev + smallVisibleRevenueUpdate));
    }
    
  }, [lastUpdateTime, setAdsCount, setRevenueCount, isPaused, setDisplayedAdsCount, setDisplayedRevenueCount, dailyAdsTarget, dailyRevenueTarget]);

  const scheduleCycleUpdate = useCallback(() => {
    return scheduleMidnightReset(
      () => {
        setAdsCount(0);
        setRevenueCount(0);
        setDisplayedAdsCount(0);
        setDisplayedRevenueCount(0);
        setIsPaused(false);
        
        // Effacer les valeurs stockées dans localStorage lors de la réinitialisation
        localStorage.removeItem('stats_ads_count');
        localStorage.removeItem('stats_revenue_count');
        localStorage.removeItem('displayed_ads_count');
        localStorage.removeItem('displayed_revenue_count');
      },
      dailyAdsTarget,
      dailyRevenueTarget
    );
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
