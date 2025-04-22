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
  const MINIMUM_REVENUE = 23918;

  // Utiliser useRef pour stocker des valeurs stables entre les rendus
  const stableValuesRef = useRef({
    adsCount: MINIMUM_ADS,
    revenueCount: MINIMUM_REVENUE,
    lastUpdate: Date.now(),
    lastSyncTime: Date.now()
  });
  
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
    
    return {
      adsCount: Math.min(Math.max(randomVariance(MINIMUM_ADS), consistentStats.adsCount), 152847),
      revenueCount: Math.min(Math.max(randomVariance(MINIMUM_REVENUE), consistentStats.revenueCount), 116329)
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
    const progressFactor = Math.min(1 + (diffDays * 0.001), 1.15); // Maximum 1.15x après 150 jours
    
    return {
      diffDays,
      progressFactor
    };
  };
  
  // S'assurer que les valeurs minimales sont respectées et ne diminuent jamais
  useEffect(() => {
    // S'assurer que les valeurs ne diminuent jamais au démarrage
    ensureProgressiveValues();
    
    // Initialiser la date de première utilisation si elle n'existe pas encore
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
      const additionalProgressFactor = 1 + ((diffDays - 30) * 0.0005); // Progression TRÈS lente
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

  // Effet pour mettre à jour les valeurs affichées lors de la réception de nouvelles valeurs
  useEffect(() => {
    if (displayedAdsCount > displayValues.adsCount) {
      setDisplayValues(prev => ({
        ...prev,
        adsCount: displayedAdsCount
      }));
    }
    
    if (displayedRevenueCount > displayValues.revenueCount) {
      setDisplayValues(prev => ({
        ...prev,
        revenueCount: displayedRevenueCount
      }));
    }
  }, [displayedAdsCount, displayedRevenueCount]);

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
        const maxRevenueCount = Math.max(displayValues.revenueCount, consistentStats.revenueCount);
        
        // Mettre à jour l'affichage et persister
        setDisplayValues({
          adsCount: maxAdsCount,
          revenueCount: maxRevenueCount
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  // Persister les valeurs avant le déchargement de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Sauvegarder les valeurs actuelles
      localStorage.setItem('last_displayed_ads_count', displayValues.adsCount.toString());
      localStorage.setItem('last_displayed_revenue_count', displayValues.revenueCount.toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [displayValues]);

  // Ajouter une légère variation aux valeurs affichées pour éviter les nombres trop ronds
  const formatAdsDisplay = (value: number) => {
    // Formater avec des chiffres irréguliers (non multiples de 1000)
    const baseFormatted = Math.floor(value).toLocaleString('fr-FR');
    return baseFormatted;
  };
  
  const formatRevenueDisplay = (value: number) => {
    // Formater avec 2 décimales pour plus de réalisme
    return formatRevenue(value, 2);
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
