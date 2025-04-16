
import { useState, useCallback } from 'react';
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

  const incrementCountersRandomly = useCallback(() => {
    // Périodes de pause naturelles - 5% de chance de mettre en pause les mises à jour
    if (Math.random() < 0.05 && !isPaused) {
      setIsPaused(true);
      console.log("Natural pause in counter updates");
      
      // Planifier la fin de la période de pause
      setTimeout(() => {
        setIsPaused(false);
        console.log("Resuming counter updates after pause");
      }, 60000 + Math.random() * 120000); // 1-3 minutes de pause
      
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
    
    // Réduire le taux horaire de 95% pour une croissance beaucoup plus lente
    const baseHourlyRate = getTotalHourlyRate(activeLocations) * 0.05; // Seulement 5% du taux original
    
    // Calculer la progression basée sur le temps avec un ralentissement naturel
    let totalAdsIncrement = Math.floor((baseHourlyRate * timeDiff) / (3600 * 1000));
    
    // Ajouter une variation naturelle selon l'heure de la journée
    const hourOfDay = new Date().getHours();
    let timeOfDayFactor = 1.0;
    
    if (hourOfDay < 6) {
      // Nuit (minuit-6h): très lent
      timeOfDayFactor = 0.1 + Math.random() * 0.1; // 10-20% de la vitesse
    } else if (hourOfDay < 9) {
      // Début de matinée (6h-9h): en progression 
      timeOfDayFactor = 0.3 + Math.random() * 0.2; // 30-50% de la vitesse
    } else if (hourOfDay < 12) {
      // Matinée (9h-midi): normal
      timeOfDayFactor = 0.5 + Math.random() * 0.3; // 50-80% de la vitesse
    } else if (hourOfDay < 15) {
      // Début d'après-midi (midi-15h): activité de pointe
      timeOfDayFactor = 0.8 + Math.random() * 0.3; // 80-110% de la vitesse
    } else if (hourOfDay < 20) {
      // Fin d'après-midi/soirée (15h-20h): activité soutenue
      timeOfDayFactor = 0.7 + Math.random() * 0.2; // 70-90% de la vitesse  
    } else {
      // Nuit (20h-minuit): ralentissement
      timeOfDayFactor = 0.3 + Math.random() * 0.2; // 30-50% de la vitesse
    }
    
    // Appliquer le facteur d'heure de la journée
    totalAdsIncrement = Math.floor(totalAdsIncrement * timeOfDayFactor);
    
    // Périodes occasionnelles très lentes (comme la maintenance du système ou une faible activité)
    if (Math.random() < 0.03) { // 3% de chance
      totalAdsIncrement = Math.floor(totalAdsIncrement * (0.1 + Math.random() * 0.3)); // 10-40% de la vitesse
    }
    
    let totalRevenue = 0;
    
    // Distribuer les annonces entre les emplacements et calculer les revenus
    activeLocations.forEach(location => {
      const locationShare = location.weight / activeLocations.reduce((sum, loc) => sum + loc.weight, 0);
      const locationAds = Math.floor(totalAdsIncrement * locationShare);
      
      // Réduire la probabilité et l'impact des pics de 90%
      const burst = calculateBurstActivity(location);
      const finalAds = burst ? Math.floor(locationAds * (1 + (burst.multiplier - 1) * 0.1)) : locationAds;
      
      totalRevenue += calculateRevenueForLocation(location, finalAds);
    });
    
    // Limitation sévère de la croissance par mise à jour 
    // Max 0.02% de l'objectif quotidien
    const maxAdsPerUpdate = Math.min(100, Math.ceil(dailyAdsTarget * 0.0002));
    const maxRevenuePerUpdate = Math.min(200, Math.ceil(dailyRevenueTarget * 0.0002));
    
    const finalAdsIncrement = Math.min(totalAdsIncrement, maxAdsPerUpdate);
    const finalRevenueIncrement = Math.min(totalRevenue, maxRevenuePerUpdate);
    
    // Ajouter une variabilité naturelle - parfois les publicités augmentent plus vite que les revenus ou vice versa
    const adjustedRevenueIncrement = Math.floor(finalRevenueIncrement * (0.9 + Math.random() * 0.2));
    
    // S'assurer que les compteurs ne descendent jamais en dessous de zéro
    setAdsCount(prev => Math.max(0, prev + finalAdsIncrement));
    setRevenueCount(prev => Math.max(0, prev + adjustedRevenueIncrement));
    setLastUpdateTime(now);
    
    // Petite chance de mise à jour visible mineure
    if (Math.random() < 0.2) { // 20% de chance de petite mise à jour visible
      const smallVisibleAdsUpdate = Math.floor(finalAdsIncrement * 0.05); // Seulement 5% de l'incrément réel
      const smallVisibleRevenueUpdate = Math.floor(adjustedRevenueIncrement * 0.05);
      
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
