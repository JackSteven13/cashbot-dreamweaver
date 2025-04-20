
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
  dailyAdsTarget = 28800, // ~1800 videos/hour × 16 hours = more realistic daily target
  dailyRevenueTarget = 40000 // ~1.5€ average per video × 28,800 videos
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });

  // Utiliser useRef pour stocker des valeurs stables entre les rendus
  const stableValuesRef = useRef({
    adsCount: 60000, // Valeur de départ plus élevée
    revenueCount: 55000, // Valeur de départ plus élevée
    lastUpdate: Date.now(),
    lastSyncTime: Date.now()
  });
  
  // État local pour l'affichage avec initialisation améliorée
  const [displayValues, setDisplayValues] = useState(() => {
    // Récupérer des valeurs cohérentes dès le début
    const consistentStats = getDateConsistentStats();
    return {
      adsCount: consistentStats.adsCount,
      revenueCount: consistentStats.revenueCount
    };
  });
  
  // Initialiser la date de première utilisation si elle n'existe pas encore
  useEffect(() => {
    if (!localStorage.getItem('first_use_date')) {
      // Définir une date antérieure pour simuler une utilisation plus longue (30 jours dans le passé)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      localStorage.setItem('first_use_date', pastDate.toISOString());
    }
    
    // Assurer des valeurs de départ élevées
    enforceMinimumStats(60000, 55000);
  }, []);
  
  // Synchroniser les valeurs stables avec les valeurs stockées au chargement
  useEffect(() => {
    // Récupérer les valeurs stockées avec progression temporelle intégrée
    const consistentStats = getDateConsistentStats();
    
    // Assurer les valeurs minimales pour éviter les fluctuations négatives
    const lastDisplayedAds = parseInt(localStorage.getItem('last_displayed_ads_count') || '0', 10);
    const lastDisplayedRevenue = parseFloat(localStorage.getItem('last_displayed_revenue_count') || '0');
    
    // Calcul plus agressif pour obtenir des valeurs plus élevées
    const finalAdsCount = Math.max(consistentStats.adsCount, lastDisplayedAds || 60000);
    const finalRevenueCount = Math.max(consistentStats.revenueCount, lastDisplayedRevenue || 55000);
    
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
    enforceMinimumStats(60000, 55000);
    
    // Persistance renforcée avec un timestamp
    localStorage.setItem('stats_last_sync', Date.now().toString());
  }, []);
  
  // Effet d'incrémentation périodique pour assurer une progression visible
  useEffect(() => {
    const incrementInterval = setInterval(() => {
      // Incrémenter statistiques de façon plus agressive
      const { newAdsCount, newRevenueCount } = incrementDateLinkedStats();
      
      setDisplayValues({
        adsCount: newAdsCount,
        revenueCount: newRevenueCount
      });
      
      // Sauvegarder les valeurs affichées
      localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
      localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
      
    }, 30000); // Incrémenter toutes les 30 secondes
    
    return () => clearInterval(incrementInterval);
  }, []);
  
  // Effet pour assurer la progression continue
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastUpdate = now - stableValuesRef.current.lastUpdate;
        
        // Si plus de 2 minutes se sont écoulées, récupérer les statistiques cohérentes
        if (timeSinceLastUpdate > 2 * 60 * 1000) {
          const consistentStats = getDateConsistentStats();
          
          // Récupérer également les dernières valeurs affichées
          const lastDisplayedAds = parseInt(localStorage.getItem('last_displayed_ads_count') || '0', 10);
          const lastDisplayedRevenue = parseFloat(localStorage.getItem('last_displayed_revenue_count') || '0');
          
          // Utiliser le maximum entre toutes les sources
          const maxAdsCount = Math.max(
            stableValuesRef.current.adsCount, 
            consistentStats.adsCount,
            lastDisplayedAds || 0,
            60000
          );
          
          const maxRevenueCount = Math.max(
            stableValuesRef.current.revenueCount, 
            consistentStats.revenueCount,
            lastDisplayedRevenue || 0,
            55000
          );
          
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
        value={displayValues.adsCount.toLocaleString('fr-FR')}
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
