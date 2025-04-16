
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
  
  // Force periodic updates for displayed values - plus fréquent
  useEffect(() => {
    // Mis à jour des compteurs visible toutes les 30 à 45 secondes (réduit de 90-120 secondes)
    const interval = setInterval(() => {
      incrementCountersRandomly();
    }, 30000 + Math.random() * 15000); // 30-45 secondes
    
    return () => clearInterval(interval);
  }, []);

  const incrementCountersRandomly = useCallback(() => {
    // Périodes de pause naturelles - réduit de 5% à 3% pour moins de pauses
    if (Math.random() < 0.03 && !isPaused) {
      setIsPaused(true);
      console.log("Natural pause in counter updates");
      
      // Planifier la fin de la période de pause - plus courte (30-60 secondes au lieu de 60-120)
      setTimeout(() => {
        setIsPaused(false);
        console.log("Resuming counter updates after pause");
      }, 30000 + Math.random() * 30000); // 30-60 secondes de pause
      
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
    // Augmenté de 0.08 à 0.12 (50% de plus)
    const baseHourlyRate = getTotalHourlyRate(activeLocations) * 0.12;
    
    // Calculer la progression basée sur le temps avec un ralentissement naturel
    let totalAdsIncrement = Math.floor((baseHourlyRate * timeDiff) / (3600 * 1000));
    
    // Ajouter une variation naturelle selon l'heure de la journée
    const hourOfDay = new Date().getHours();
    let timeOfDayFactor = 1.0;
    
    // Réduction moins sévère pendant les heures creuses et augmentation pendant les pics
    if (hourOfDay < 6) {
      // Nuit (minuit-6h): lent mais pas trop
      timeOfDayFactor = 0.35 + Math.random() * 0.2; // 35-55% de la vitesse (augmenté)
    } else if (hourOfDay < 9) {
      // Début de matinée (6h-9h): en progression 
      timeOfDayFactor = 0.55 + Math.random() * 0.25; // 55-80% de la vitesse (augmenté)
    } else if (hourOfDay < 12) {
      // Matinée (9h-midi): normal
      timeOfDayFactor = 0.75 + Math.random() * 0.35; // 75-110% de la vitesse (augmenté)
    } else if (hourOfDay < 15) {
      // Début d'après-midi (midi-15h): activité de pointe
      timeOfDayFactor = 1.0 + Math.random() * 0.4; // 100-140% de la vitesse (augmenté)
    } else if (hourOfDay < 20) {
      // Fin d'après-midi/soirée (15h-20h): activité soutenue
      timeOfDayFactor = 0.9 + Math.random() * 0.3; // 90-120% de la vitesse (augmenté)
    } else {
      // Nuit (20h-minuit): ralentissement
      timeOfDayFactor = 0.6 + Math.random() * 0.2; // 60-80% de la vitesse (augmenté)
    }
    
    // Appliquer le facteur d'heure de la journée
    totalAdsIncrement = Math.floor(totalAdsIncrement * timeOfDayFactor);
    
    // Périodes occasionnelles très lentes (comme la maintenance du système)
    // Réduit la probabilité de 3% à 2% et augmenté le facteur min de 0.2 à 0.3
    if (Math.random() < 0.02) {
      totalAdsIncrement = Math.floor(totalAdsIncrement * (0.3 + Math.random() * 0.3));
    }
    
    let totalRevenue = 0;
    
    // Distribuer les annonces entre les emplacements et calculer les revenus
    activeLocations.forEach(location => {
      const locationShare = location.weight / activeLocations.reduce((sum, loc) => sum + loc.weight, 0);
      const locationAds = Math.floor(totalAdsIncrement * locationShare);
      
      // Réduire la probabilité et l'impact des pics de 90%
      // Augmenté le multiplicateur de burst de 0.2 à 0.35 (75% de plus)
      const burst = calculateBurstActivity(location);
      const finalAds = burst ? Math.floor(locationAds * (1 + (burst.multiplier - 1) * 0.35)) : locationAds;
      
      totalRevenue += calculateRevenueForLocation(location, finalAds);
    });
    
    // Limitation de la croissance par mise à jour
    // Max 0.06% de l'objectif quotidien (augmenté de 0.04% à 0.06%)
    const maxAdsPerUpdate = Math.min(300, Math.ceil(dailyAdsTarget * 0.0006)); 
    const maxRevenuePerUpdate = Math.min(600, Math.ceil(dailyRevenueTarget * 0.0006));
    
    const finalAdsIncrement = Math.min(totalAdsIncrement, maxAdsPerUpdate);
    const finalRevenueIncrement = Math.min(totalRevenue, maxRevenuePerUpdate);
    
    // Ajouter une variabilité naturelle - parfois les publicités augmentent plus vite que les revenus ou vice versa
    // Augmenté la variabilité de 0.9-1.1 à 0.85-1.25
    const adjustedRevenueIncrement = Math.floor(finalRevenueIncrement * (0.85 + Math.random() * 0.4));
    
    // S'assurer que les compteurs ne descendent jamais en dessous de zéro
    setAdsCount(prev => Math.max(0, prev + finalAdsIncrement));
    setRevenueCount(prev => Math.max(0, prev + adjustedRevenueIncrement));
    setLastUpdateTime(now);
    
    // Augmenter la probabilité de mises à jour visibles mineures
    // Augmenté de 40% à 60% de chance
    if (Math.random() < 0.6) {
      // Augmenté de 10% à 15% des incréments
      const smallVisibleAdsUpdate = Math.floor(finalAdsIncrement * 0.15);
      const smallVisibleRevenueUpdate = Math.floor(adjustedRevenueIncrement * 0.15);
      
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
