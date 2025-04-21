import React, { useEffect, useState, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';
import { 
  loadStoredValues, 
  incrementDateLinkedStats, 
  enforceMinimumStats, 
  getDateConsistentStats 
} from '@/hooks/stats/utils/storageManager';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 10000, // Valeur plus réaliste
  dailyRevenueTarget = 8000 // Valeur plus réaliste
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });

  // Base de départ réaliste
  const MINIMUM_ADS = 35000;
  const MINIMUM_REVENUE = 25000;

  // Utiliser useRef pour stocker des valeurs stables entre les rendus
  const stableValuesRef = useRef({
    adsCount: MINIMUM_ADS,
    revenueCount: MINIMUM_REVENUE,
    lastUpdate: Date.now(),
    lastSyncTime: Date.now()
  });
  
  // État local pour l'affichage avec initialisation améliorée
  const [displayValues, setDisplayValues] = useState(() => {
    // Récupérer des valeurs cohérentes et réalistes dès le début
    const consistentStats = getDateConsistentStats();
    return {
      adsCount: Math.min(Math.max(MINIMUM_ADS, consistentStats.adsCount), 180000),
      revenueCount: Math.min(Math.max(MINIMUM_REVENUE, consistentStats.revenueCount), 140000)
    };
  });

  // Fonction pour simuler une progression très graduelle basée sur l'ancienneté
  const calculateProgression = () => {
    // Récupérer ou créer la date d'installation
    const firstUseDate = localStorage.getItem('first_use_date');
    if (!firstUseDate) {
      // Définir une date antérieure pour simuler une utilisation plus longue (30 jours dans le passé - plus crédible)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      localStorage.setItem('first_use_date', pastDate.toISOString());
    }
    
    // Calculer le nombre de jours depuis l'installation
    const installDate = new Date(localStorage.getItem('first_use_date') || '');
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - installDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculer un facteur de progression TRÈS limité basé sur l'ancienneté
    const progressFactor = Math.min(1 + (diffDays * 0.002), 1.25); // Maximum 1.25x après 125 jours
    
    return {
      diffDays,
      progressFactor
    };
  };
  
  // Initialiser la date de première utilisation si elle n'existe pas encore
  useEffect(() => {
    if (!localStorage.getItem('first_use_date')) {
      // Définir une date antérieure pour simuler une utilisation plus longue (30 jours dans le passé)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      localStorage.setItem('first_use_date', pastDate.toISOString());
    }
    
    // S'assurer des valeurs de départ réalistes
    enforceMinimumStats(MINIMUM_ADS, MINIMUM_REVENUE);
    
    // Initialiser la progression
    const { diffDays, progressFactor } = calculateProgression();
    
    // Si l'application est utilisée depuis plus de 30 jours, augmenter légèrement les valeurs de base
    if (diffDays > 30) {
      const additionalProgressFactor = 1 + ((diffDays - 30) * 0.001); // Progression TRÈS lente
      const newMinimumAds = MINIMUM_ADS * additionalProgressFactor;
      const newMinimumRevenue = MINIMUM_REVENUE * additionalProgressFactor;
      
      enforceMinimumStats(newMinimumAds, newMinimumRevenue);
      
      const consistentStats = getDateConsistentStats();
      setDisplayValues({
        adsCount: Math.max(newMinimumAds, consistentStats.adsCount),
        revenueCount: Math.max(newMinimumRevenue, consistentStats.revenueCount)
      });
    }
  }, []);
  
  // Synchroniser les valeurs stables avec les valeurs stockées au chargement
  useEffect(() => {
    // Récupérer les valeurs stockées avec progression temporelle intégrée
    const consistentStats = getDateConsistentStats();
    const { progressFactor } = calculateProgression();
    
    // Assurer les valeurs minimales pour éviter les fluctuations négatives
    const lastDisplayedAds = parseInt(localStorage.getItem('last_displayed_ads_count') || '0', 10);
    const lastDisplayedRevenue = parseFloat(localStorage.getItem('last_displayed_revenue_count') || '0');
    
    // Calcul pour obtenir des valeurs plus impressionnantes
    const baseAds = Math.max(consistentStats.adsCount, lastDisplayedAds || MINIMUM_ADS);
    const baseRevenue = Math.max(consistentStats.revenueCount, lastDisplayedRevenue || MINIMUM_REVENUE);
    
    // Appliquer le facteur de progression pour une croissance continue vers des valeurs impressionnantes
    const finalAdsCount = Math.floor(baseAds * progressFactor);
    const finalRevenueCount = baseRevenue * progressFactor;
    
    // Stocker dans la référence stable
    stableValuesRef.current = {
      adsCount: finalAdsCount,
      revenueCount: finalRevenueCount,
      lastUpdate: Date.now(),
      lastSyncTime: Date.now()
    };
    
    // Mettre à jour l'affichage
    setDisplayValues({
      adsCount: finalAdsCount,
      revenueCount: finalRevenueCount
    });
    
    // Persister pour assurer la cohérence entre les rendus
    localStorage.setItem('last_displayed_ads_count', finalAdsCount.toString());
    localStorage.setItem('last_displayed_revenue_count', finalRevenueCount.toString());
    
    // S'assurer que les valeurs minimales sont respectées
    enforceMinimumStats(MINIMUM_ADS * progressFactor, MINIMUM_REVENUE * progressFactor);
    
    // Persistance renforcée avec un timestamp
    localStorage.setItem('stats_last_sync', Date.now().toString());
  }, []);
  
  // Effet d'incrémentation périodique avec progression TRÈS lente
  useEffect(() => {
    const incrementInterval = setInterval(() => {
      // Incrémenter statistiques de façon TRÈS modérée
      const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
      
      setDisplayValues({
        adsCount: newAdsCount,
        revenueCount: newRevenueCount
      });
      
      // Sauvegarder les valeurs affichées
      localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
      localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
      
    }, 120000); // Incrémenter toutes les 2 minutes (beaucoup moins fréquent)
    
    return () => clearInterval(incrementInterval);
  }, []);
  
  // Effet pour assurer la progression continue et des chiffres impressionnants
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastUpdate = now - stableValuesRef.current.lastUpdate;
        
        // Si plus de 2 minutes se sont écoulées, récupérer les statistiques cohérentes
        if (timeSinceLastUpdate > 2 * 60 * 1000) {
          const consistentStats = getDateConsistentStats();
          const { progressFactor } = calculateProgression();
          
          // Récupérer également les dernières valeurs affichées
          const lastDisplayedAds = parseInt(localStorage.getItem('last_displayed_ads_count') || '0', 10);
          const lastDisplayedRevenue = parseFloat(localStorage.getItem('last_displayed_revenue_count') || '0');
          
          // Utiliser le maximum entre toutes les sources et appliquer un facteur de progression
          const maxAdsCount = Math.max(
            stableValuesRef.current.adsCount, 
            consistentStats.adsCount,
            lastDisplayedAds || 0,
            MINIMUM_ADS
          ) * progressFactor;
          
          const maxRevenueCount = Math.max(
            stableValuesRef.current.revenueCount, 
            consistentStats.revenueCount,
            lastDisplayedRevenue || 0,
            MINIMUM_REVENUE
          ) * progressFactor;
          
          // Mettre à jour la référence stable
          stableValuesRef.current = {
            ...stableValuesRef.current,
            adsCount: maxAdsCount,
            revenueCount: maxRevenueCount,
            lastUpdate: now
          };
          
          // Mettre à jour l'affichage et persister
          setDisplayValues({
            adsCount: maxAdsCount,
            revenueCount: maxRevenueCount
          });
          
          // Persister pour maintenir la cohérence
          localStorage.setItem('last_displayed_ads_count', maxAdsCount.toString());
          localStorage.setItem('last_displayed_revenue_count', maxRevenueCount.toString());
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-4 md:mb-6">
      <StatPanel 
        value={Math.floor(displayValues.adsCount).toLocaleString('fr-FR')}
        label="Publicités analysées"
        className="text-sm animate-pulse-slow" 
      />
      <StatPanel 
        value={formatRevenue(displayValues.revenueCount)}
        label="Revenus générés"
        className="text-sm animate-pulse-slow" 
      />
    </div>
  );
};

export default StatsCounter;
