
import React, { useEffect, useState, useRef } from 'react';
import StatPanel from './StatPanel';
import { useStatsCounter } from '@/hooks/useStatsCounter';
import { formatRevenue } from '@/utils/formatters';

interface StatsCounterProps {
  dailyAdsTarget?: number;
  dailyRevenueTarget?: number;
}

// Minimum baseline values that should never be dropped below
const MINIMUM_ADS_COUNT = 40000;
const MINIMUM_REVENUE_COUNT = 50000;

const StatsCounter = ({
  dailyAdsTarget = 28800, // ~1800 videos/hour × 16 hours = more realistic daily target
  dailyRevenueTarget = 40000 // ~1.5€ average per video × 28,800 videos
}: StatsCounterProps) => {
  const { displayedAdsCount, displayedRevenueCount } = useStatsCounter({
    dailyAdsTarget,
    dailyRevenueTarget
  });
  
  // Local state to prevent flickering or unexpected drops
  const [stableAdsCount, setStableAdsCount] = useState(() => {
    // Initialiser avec des valeurs de session ou localStorage, avec priorité à sessionStorage
    const storedSession = sessionStorage.getItem('displayed_ads_count');
    const stored = localStorage.getItem('displayed_ads_count');
    return storedSession 
      ? Math.max(MINIMUM_ADS_COUNT, parseInt(storedSession, 10))
      : (stored ? Math.max(MINIMUM_ADS_COUNT, parseInt(stored, 10)) : MINIMUM_ADS_COUNT);
  });
  
  const [stableRevenueCount, setStableRevenueCount] = useState(() => {
    // Initialiser avec des valeurs de session ou localStorage, avec priorité à sessionStorage
    const storedSession = sessionStorage.getItem('displayed_revenue_count');
    const stored = localStorage.getItem('displayed_revenue_count');
    return storedSession 
      ? Math.max(MINIMUM_REVENUE_COUNT, parseInt(storedSession, 10))
      : (stored ? Math.max(MINIMUM_REVENUE_COUNT, parseInt(stored, 10)) : MINIMUM_REVENUE_COUNT);
  });
  
  const previousAdsCountRef = useRef(stableAdsCount);
  const previousRevenueCountRef = useRef(stableRevenueCount);
  
  // Sauvegarder les valeurs initiales dans sessionStorage pour persistance stricte lors des rechargements
  useEffect(() => {
    const saveToSession = () => {
      try {
        // Sauvegarder les valeurs initiales stables dans sessionStorage
        sessionStorage.setItem('displayed_ads_count', stableAdsCount.toString());
        sessionStorage.setItem('displayed_revenue_count', stableRevenueCount.toString());
        
        // Aussi sauvegarder dans localStorage pour la persitence à long terme
        localStorage.setItem('displayed_ads_count', stableAdsCount.toString());
        localStorage.setItem('displayed_revenue_count', stableRevenueCount.toString());
      } catch (e) {
        console.error('Error saving initial counter values to sessionStorage:', e);
      }
    };
    
    saveToSession();
    
    // Aussi sauvegarder avant que la page ne soit déchargée
    window.addEventListener('beforeunload', saveToSession);
    return () => window.removeEventListener('beforeunload', saveToSession);
  }, []);
  
  // Protection pour éviter les valeurs à 0 ou inférieures aux minimums au chargement initial
  useEffect(() => {
    // Si on a des valeurs à 0 ou inférieures aux minimums, restaurer les dernières valeurs connues
    if (displayedAdsCount < MINIMUM_ADS_COUNT || displayedRevenueCount < MINIMUM_REVENUE_COUNT) {
      // Vérifier d'abord sessionStorage (plus fiable pour les rechargements)
      const sessionAdsCount = sessionStorage.getItem('displayed_ads_count');
      const sessionRevenueCount = sessionStorage.getItem('displayed_revenue_count');
      
      // Ensuite vérifier localStorage comme fallback
      const lastAdsCount = localStorage.getItem('displayed_ads_count');
      const lastRevenueCount = localStorage.getItem('displayed_revenue_count');
      
      // Utiliser sessionStorage en priorité
      if (sessionAdsCount) {
        const parsedAdsCount = parseInt(sessionAdsCount, 10);
        if (!isNaN(parsedAdsCount) && parsedAdsCount >= MINIMUM_ADS_COUNT) {
          previousAdsCountRef.current = parsedAdsCount;
        }
      } else if (lastAdsCount) {
        const parsedAdsCount = parseInt(lastAdsCount, 10);
        if (!isNaN(parsedAdsCount) && parsedAdsCount >= MINIMUM_ADS_COUNT) {
          previousAdsCountRef.current = parsedAdsCount;
        }
      } else {
        previousAdsCountRef.current = MINIMUM_ADS_COUNT;
      }
      
      // Même logique pour le revenu
      if (sessionRevenueCount) {
        const parsedRevenueCount = parseInt(sessionRevenueCount, 10);
        if (!isNaN(parsedRevenueCount) && parsedRevenueCount >= MINIMUM_REVENUE_COUNT) {
          previousRevenueCountRef.current = parsedRevenueCount;
        }
      } else if (lastRevenueCount) {
        const parsedRevenueCount = parseInt(lastRevenueCount, 10);
        if (!isNaN(parsedRevenueCount) && parsedRevenueCount >= MINIMUM_REVENUE_COUNT) {
          previousRevenueCountRef.current = parsedRevenueCount;
        }
      } else {
        previousRevenueCountRef.current = MINIMUM_REVENUE_COUNT;
      }
      
      // Mettre à jour l'état avec les valeurs restaurées
      setStableAdsCount(previousAdsCountRef.current);
      setStableRevenueCount(previousRevenueCountRef.current);
      
      // Sauvegarder ces valeurs corrigées dans les deux stockages
      sessionStorage.setItem('displayed_ads_count', previousAdsCountRef.current.toString());
      sessionStorage.setItem('displayed_revenue_count', previousRevenueCountRef.current.toString());
      localStorage.setItem('displayed_ads_count', previousAdsCountRef.current.toString());
      localStorage.setItem('displayed_revenue_count', previousRevenueCountRef.current.toString());
    }
  }, [displayedAdsCount, displayedRevenueCount]);
  
  // Update stable values when displayed values change, but only increase them
  useEffect(() => {
    // N'appliquer que des augmentations, jamais de diminutions
    if (displayedAdsCount > stableAdsCount && displayedAdsCount >= MINIMUM_ADS_COUNT) {
      setStableAdsCount(displayedAdsCount);
      previousAdsCountRef.current = displayedAdsCount;
      
      // Synchroniser immédiatement avec sessionStorage et localStorage
      sessionStorage.setItem('displayed_ads_count', displayedAdsCount.toString());
      localStorage.setItem('displayed_ads_count', displayedAdsCount.toString());
    }
    
    if (displayedRevenueCount > stableRevenueCount && displayedRevenueCount >= MINIMUM_REVENUE_COUNT) {
      setStableRevenueCount(displayedRevenueCount);
      previousRevenueCountRef.current = displayedRevenueCount;
      
      // Synchroniser immédiatement avec sessionStorage et localStorage
      sessionStorage.setItem('displayed_revenue_count', displayedRevenueCount.toString());
      localStorage.setItem('displayed_revenue_count', displayedRevenueCount.toString());
    }
    
    // Si nous détectons une diminution, utiliser les valeurs précédentes stables
    if (displayedAdsCount < previousAdsCountRef.current) {
      console.log('Preventing ads count decrease:', 
                  displayedAdsCount, '->', previousAdsCountRef.current);
    }
    
    if (displayedRevenueCount < previousRevenueCountRef.current) {
      console.log('Preventing revenue count decrease:', 
                  displayedRevenueCount, '->', previousRevenueCountRef.current);
    }
  }, [displayedAdsCount, displayedRevenueCount, stableAdsCount, stableRevenueCount]);

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-4 md:mb-6">
      <StatPanel 
        value={stableAdsCount.toLocaleString('fr-FR')}
        label="Publicités analysées"
        className="text-sm animate-pulse-slow" 
      />
      <StatPanel 
        value={formatRevenue(stableRevenueCount)}
        label="Revenus générés"
        className="text-sm animate-pulse-slow" 
      />
    </div>
  );
};

export default StatsCounter;
