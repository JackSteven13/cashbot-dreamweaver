
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
    adsCount: 40000,
    revenueCount: 50000,
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
  
  // Synchroniser les valeurs stables avec les valeurs stockées au chargement
  useEffect(() => {
    // Récupérer les valeurs stockées avec progression temporelle intégrée
    const consistentStats = getDateConsistentStats();
    
    // Assurer les valeurs minimales pour éviter les fluctuations négatives
    const lastDisplayedAds = parseInt(localStorage.getItem('last_displayed_ads_count') || '0', 10);
    const lastDisplayedRevenue = parseFloat(localStorage.getItem('last_displayed_revenue_count') || '0');
    
    const finalAdsCount = Math.max(consistentStats.adsCount, lastDisplayedAds || 40000);
    const finalRevenueCount = Math.max(consistentStats.revenueCount, lastDisplayedRevenue || 50000);
    
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
    enforceMinimumStats(40000, 50000);
    
    // Persistance renforcée avec un timestamp
    localStorage.setItem('stats_last_sync', Date.now().toString());
  }, []);
  
  // Synchroniser avec les événements de mise à jour du feed des publicités de façon STRICTE
  useEffect(() => {
    const handleLocationAdded = (event: CustomEvent) => {
      // Vérifier le temps écoulé depuis la dernière mise à jour pour empêcher les mises à jour trop fréquentes
      const now = Date.now();
      if (now - stableValuesRef.current.lastSyncTime < 15000) { // Au moins 15 secondes entre les mises à jour
        console.log("Mise à jour des stats trop rapide, ignorée");
        return;
      }
      
      stableValuesRef.current.lastSyncTime = now;
      
      // Attendre un délai plus important pour que l'analyse soit simulée
      setTimeout(() => {
        // Incrémenter UNIQUEMENT d'une vidéo à la fois, jamais plus
        setDisplayValues(prev => {
          const newAdsCount = prev.adsCount + 1;
          const newRevenueCount = prev.revenueCount + (Math.random() * 0.3 + 0.2); // 0.2-0.5€ par vidéo
          
          // Persister immédiatement pour maintenir la cohérence entre les sessions
          localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
          localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
          
          return {
            adsCount: newAdsCount,
            revenueCount: newRevenueCount
          };
        });
      }, 5000 + Math.random() * 3000); // Délai entre 5 et 8 secondes
    };
    
    window.addEventListener('location:added', handleLocationAdded as EventListener);
    return () => window.removeEventListener('location:added', handleLocationAdded as EventListener);
  }, []);

  // Mettre à jour les valeurs stables et persistantes seulement si les valeurs de useStatsCounter augmentent significativement
  useEffect(() => {
    if (displayedAdsCount > stableValuesRef.current.adsCount + 10) { // Seuil de différence significative
      stableValuesRef.current = {
        ...stableValuesRef.current,
        adsCount: displayedAdsCount,
        lastUpdate: Date.now()
      };
      
      // Ne pas mettre à jour l'interface trop rapidement, progression extrêmement lente
      setDisplayValues(prev => {
        const newAdsCount = prev.adsCount + 1; // Toujours incrémenter de 1 seulement
        // Persister pour maintenir la cohérence
        localStorage.setItem('last_displayed_ads_count', newAdsCount.toString());
        return {
          ...prev,
          adsCount: newAdsCount
        };
      });
    }
    
    if (displayedRevenueCount > stableValuesRef.current.revenueCount + 5) { // Seuil de différence significative
      stableValuesRef.current = {
        ...stableValuesRef.current,
        revenueCount: displayedRevenueCount,
        lastUpdate: Date.now()
      };
      
      // Progression très lente du revenu également
      setDisplayValues(prev => {
        const newRevenueCount = prev.revenueCount + 0.3; // Incrément très faible
        // Persister pour maintenir la cohérence
        localStorage.setItem('last_displayed_revenue_count', newRevenueCount.toString());
        return {
          ...prev,
          revenueCount: newRevenueCount
        };
      });
    }
  }, [displayedAdsCount, displayedRevenueCount]);

  // Effet pour assurer la progression continue mais EXTRÊMEMENT lente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastUpdate = now - stableValuesRef.current.lastUpdate;
        
        // Si plus de 10 minutes se sont écoulées, récupérer les statistiques cohérentes
        if (timeSinceLastUpdate > 10 * 60 * 1000) {
          const consistentStats = getDateConsistentStats();
          
          // Récupérer également les dernières valeurs affichées
          const lastDisplayedAds = parseInt(localStorage.getItem('last_displayed_ads_count') || '0', 10);
          const lastDisplayedRevenue = parseFloat(localStorage.getItem('last_displayed_revenue_count') || '0');
          
          // Utiliser le maximum entre toutes les sources
          const maxAdsCount = Math.max(
            stableValuesRef.current.adsCount, 
            consistentStats.adsCount,
            lastDisplayedAds || 0,
            40000
          );
          
          const maxRevenueCount = Math.max(
            stableValuesRef.current.revenueCount, 
            consistentStats.revenueCount,
            lastDisplayedRevenue || 0,
            50000
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
