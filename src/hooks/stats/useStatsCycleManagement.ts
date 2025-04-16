
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
  LAST_UPDATE_TIME: 'stats_last_update_time',
  LAST_RESET_DATE: 'stats_last_reset_date'
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
  const [lastResetDate, setLastResetDate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE) || new Date().toDateString();
  });
  
  // Track pause periods for more natural progression
  const [isPaused, setIsPaused] = useState(false);
  
  // Assurer une progression continue avec des mises à jour régulières
  // même si l'utilisateur n'interagit pas avec la page
  useEffect(() => {
    // Mises à jour régulières toutes les 10 secondes pour éviter la stagnation
    const interval = setInterval(() => {
      incrementCountersRandomly();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const incrementCountersRandomly = useCallback(() => {
    // Périodes de pause naturelles très réduites (seulement 1% de chance)
    if (Math.random() < 0.01 && !isPaused) {
      setIsPaused(true);
      console.log("Natural pause in counter updates");
      
      // Planifier la fin de la période de pause - très courte (5-15 secondes)
      setTimeout(() => {
        setIsPaused(false);
        console.log("Resuming counter updates after pause");
      }, 5000 + Math.random() * 10000);
      
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
    
    // Utiliser un taux horaire plus réaliste basé sur 20 bots
    // ~90 vidéos par heure par bot = 1800 vidéos par heure
    const baseHourlyRate = getTotalHourlyRate(activeLocations);
    
    // Calculer la progression basée sur le temps écoulé
    // Pour 20 bots traitant ~1800 vidéos/heure, cela fait ~30 vidéos/minute = 0.5 vidéos/seconde
    const timeBasedIncrement = (baseHourlyRate * timeDiff) / (3600 * 1000);
    
    // Ajouter une variation naturelle pour éviter une progression trop linéaire
    const variationFactor = 0.8 + Math.random() * 0.4; // 80%-120% du taux de base
    let totalAdsIncrement = Math.max(1, Math.floor(timeBasedIncrement * variationFactor));
    
    // Limiter l'incrément à un maximum réaliste pour éviter des sauts trop grands
    // Maximum ~5 vidéos par mise à jour (10 secondes = ~5 vidéos)
    totalAdsIncrement = Math.min(totalAdsIncrement, 5);
    
    // S'assurer qu'il y a toujours une progression minimale pour éviter la stagnation
    totalAdsIncrement = Math.max(totalAdsIncrement, 1);
    
    let totalRevenue = 0;
    
    // Distribuer les annonces entre les emplacements et calculer les revenus
    activeLocations.forEach(location => {
      const locationShare = location.weight / activeLocations.reduce((sum, loc) => sum + loc.weight, 0);
      const locationAds = Math.max(1, Math.floor(totalAdsIncrement * locationShare));
      
      // Calculer les revenus de manière réaliste pour ce nombre d'annonces
      totalRevenue += calculateRevenueForLocation(location, locationAds);
    });
    
    // S'assurer que les compteurs ne descendent jamais en dessous de zéro
    setAdsCount(prev => Math.max(0, prev + totalAdsIncrement));
    setRevenueCount(prev => Math.max(0, prev + totalRevenue));
    setLastUpdateTime(now);
    
    // Appliquer une partie de la mise à jour aux compteurs affichés
    // pour une sensation de progression continue
    if (Math.random() < 0.4) { // 40% de chance
      const visibleAdsUpdate = Math.ceil(totalAdsIncrement * 0.3); // 30% de l'incrément
      const visibleRevenueUpdate = totalRevenue * 0.3; // 30% de l'incrément de revenu
      
      setDisplayedAdsCount(prev => Math.max(0, prev + visibleAdsUpdate));
      setDisplayedRevenueCount(prev => Math.max(0, prev + visibleRevenueUpdate));
    }
    
  }, [lastUpdateTime, setAdsCount, setRevenueCount, isPaused, setDisplayedAdsCount, setDisplayedRevenueCount]);

  const scheduleCycleUpdate = useCallback(() => {
    // Vérifier si la réinitialisation a déjà eu lieu aujourd'hui
    const today = new Date().toDateString();
    if (today === lastResetDate) {
      console.log("Reset already happened today, skipping");
      return null; // Ne pas planifier de réinitialisation si déjà fait aujourd'hui
    }
    
    // Sauvegarder la date de la dernière réinitialisation
    localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
    setLastResetDate(today);
    
    return scheduleMidnightReset(
      () => {
        // Mettre à jour la date de réinitialisation avant de tout réinitialiser
        const resetDate = new Date().toDateString();
        localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, resetDate);
        setLastResetDate(resetDate);
        
        // Réinitialiser les compteurs à zéro seulement si c'est un nouveau jour
        if (resetDate !== lastResetDate) {
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
        }
      },
      dailyAdsTarget,
      dailyRevenueTarget
    );
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount, lastResetDate]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
