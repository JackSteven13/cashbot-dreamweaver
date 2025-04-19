
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
    
    // Stocker dans la référence stable
    stableValuesRef.current = {
      adsCount: consistentStats.adsCount,
      revenueCount: consistentStats.revenueCount,
      lastUpdate: Date.now(),
      lastSyncTime: Date.now()
    };
    
    // Mettre à jour l'affichage
    setDisplayValues({
      adsCount: consistentStats.adsCount,
      revenueCount: consistentStats.revenueCount
    });
    
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
        setDisplayValues(prev => ({
          adsCount: prev.adsCount + 1,
          revenueCount: prev.revenueCount + (Math.random() * 0.3 + 0.2) // 0.2-0.5€ par vidéo (montant plus réaliste)
        }));
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
      setDisplayValues(prev => ({
        ...prev,
        adsCount: prev.adsCount + 1 // Toujours incrémenter de 1 seulement
      }));
    }
    
    if (displayedRevenueCount > stableValuesRef.current.revenueCount + 5) { // Seuil de différence significative
      stableValuesRef.current = {
        ...stableValuesRef.current,
        revenueCount: displayedRevenueCount,
        lastUpdate: Date.now()
      };
      
      // Progression très lente du revenu également
      setDisplayValues(prev => ({
        ...prev,
        revenueCount: prev.revenueCount + 0.3 // Incrément très faible
      }));
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
          
          // Mettre à jour seulement si les nouvelles valeurs sont plus grandes
          const newAdsCount = Math.max(stableValuesRef.current.adsCount, consistentStats.adsCount);
          const newRevenueCount = Math.max(stableValuesRef.current.revenueCount, consistentStats.revenueCount);
          
          // Mettre à jour la référence stable
          stableValuesRef.current = {
            ...stableValuesRef.current,
            adsCount: newAdsCount,
            revenueCount: newRevenueCount,
            lastUpdate: now
          };
          
          // Mettre à jour l'affichage de façon très progressive
          setDisplayValues(prev => ({
            adsCount: prev.adsCount + 1, // Toujours +1 seulement
            revenueCount: prev.revenueCount + 0.25 // Très petit incrément
          }));
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
