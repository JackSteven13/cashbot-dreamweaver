
import React, { useEffect, useState, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';
import { 
  loadStoredValues, 
  incrementDateLinkedStats, 
  enforceMinimumStats, 
  getDateConsistentStats,
  ensureProgressiveValues
} from '@/hooks/stats/utils/storageManager';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

const StatsCounter = ({
  dailyAdsTarget = 4723, // Valeur non-ronde plus réaliste
  dailyRevenueTarget = 3819 // Valeur non-ronde plus réaliste
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });

  // Base de départ réaliste avec des chiffres irréguliers
  const MINIMUM_ADS = 36742;
  const MINIMUM_REVENUE = 28000; // Augmenté pour maintenir la corrélation

  // Utiliser useRef pour stocker des valeurs stables entre les rendus
  const stableValuesRef = useRef({
    adsCount: MINIMUM_ADS,
    revenueCount: MINIMUM_REVENUE,
    lastUpdate: Date.now(),
    lastSyncTime: Date.now()
  });
  
  // Définir un ratio de corrélation constant
  const CORRELATION_RATIO = 0.76203;
  
  // État local pour l'affichage avec initialisation améliorée
  const [displayValues, setDisplayValues] = useState(() => {
    // S'assurer que les valeurs ne diminuent jamais au démarrage
    ensureProgressiveValues();
    
    // Récupérer des valeurs cohérentes et réalistes dès le début
    const consistentStats = getDateConsistentStats();
    
    // Ajouter une légère variance aléatoire pour des nombres moins ronds
    const randomVariance = (value: number) => {
      // Variation de ±0.5%
      const variance = 1 + ((Math.random() - 0.5) * 0.01);
      return Math.floor(value * variance);
    };
    
    // Toujours calculer les revenus en fonction des pubs pour assurer la corrélation
    const ads = Math.min(Math.max(randomVariance(MINIMUM_ADS), consistentStats.adsCount), 152847);
    const revenue = ads * CORRELATION_RATIO;
    
    return {
      adsCount: ads,
      revenueCount: revenue
    };
  });

  // Effet pour mettre à jour les valeurs affichées lors de la réception de nouvelles valeurs
  useEffect(() => {
    if (displayedAdsCount > displayValues.adsCount) {
      // Calculer le nouveau revenu en fonction des nouvelles publicités
      const newRevenue = displayedAdsCount * CORRELATION_RATIO;
      
      setDisplayValues({
        adsCount: displayedAdsCount,
        revenueCount: newRevenue
      });
    }
  }, [displayedAdsCount]);

  // Effet pour gérer la visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Quand la page redevient visible, s'assurer que les valeurs sont correctes
        ensureProgressiveValues();
        
        // Récupérer les valeurs cohérentes
        const consistentStats = getDateConsistentStats();
        
        // Utiliser les valeurs maximales pour éviter toute diminution
        const maxAdsCount = Math.max(displayValues.adsCount, consistentStats.adsCount);
        // Toujours calculer les revenus à partir des publicités
        const newRevenueCount = maxAdsCount * CORRELATION_RATIO;
        
        // Mettre à jour l'affichage et persister
        setDisplayValues({
          adsCount: maxAdsCount,
          revenueCount: newRevenueCount
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [displayValues]);

  // Persister les valeurs avant le déchargement de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Sauvegarder les valeurs actuelles avec synchronisation parfaite
      localStorage.setItem('last_displayed_ads_count', displayValues.adsCount.toString());
      localStorage.setItem('last_displayed_revenue_count', (displayValues.adsCount * CORRELATION_RATIO).toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [displayValues]);

  // Créer un intervalle pour des mises à jour régulières avec synchronisation forcée
  useEffect(() => {
    const regularUpdateInterval = setInterval(() => {
      // Incrémenter légèrement les annonces
      const adsIncrement = Math.floor(Math.random() * 5) + 1; // 1-5 annonces par mise à jour
      
      setDisplayValues(prev => {
        const newAdsCount = prev.adsCount + adsIncrement;
        // Calculer DIRECTEMENT le revenu en fonction des publicités
        const newRevenueCount = newAdsCount * CORRELATION_RATIO;
        
        return {
          adsCount: newAdsCount,
          revenueCount: newRevenueCount
        };
      });
      
    }, 5000); // Toutes les 5 secondes
    
    return () => {
      clearInterval(regularUpdateInterval);
    };
  }, []);

  // Ajouter une légère variation aux valeurs affichées pour éviter les nombres trop ronds
  const formatAdsDisplay = (value: number) => {
    // Formater avec des chiffres irréguliers (non multiples de 1000)
    const baseFormatted = Math.floor(value).toLocaleString('fr-FR');
    return baseFormatted;
  };
  
  const formatRevenueDisplay = (value: number) => {
    // Formater avec 2 décimales pour plus de réalisme
    return formatRevenue(value);
  };

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-4 md:mb-6">
      <StatPanel 
        value={formatAdsDisplay(displayValues.adsCount)}
        label="Publicités analysées"
        className="text-sm animate-pulse-slow" 
      />
      <StatPanel 
        value={formatRevenueDisplay(displayValues.revenueCount)}
        label="Revenus générés"
        className="text-sm animate-pulse-slow" 
      />
    </div>
  );
};

export default StatsCounter;
