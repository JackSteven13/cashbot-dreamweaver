
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';

interface StatisticsDisplayProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  prefix?: string;
  suffix?: string;
}

const StatisticCard: React.FC<StatisticsDisplayProps> = ({
  title,
  value,
  icon,
  description,
  prefix,
  suffix
}) => {
  return (
    <Card className="stat-card transition-all duration-300 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h2>
          <div className="text-blue-600 dark:text-blue-400">{icon}</div>
        </div>
        <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {prefix}<AnimatedNumber value={value} duration={300} formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} />{suffix}
        </div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const StatisticsDisplay: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  
  // Définir un ratio constant pour la corrélation parfaite
  const CORRELATION_RATIO = 0.76203;
  
  const { adsCount, revenueCount, incrementStats } = usePersistentStats({
    autoIncrement: true,
    userId: userId || 'anonymous',
    forceGrowth: true,
    correlationRatio: CORRELATION_RATIO // Corrélation parfaite entre publicités et revenus
  });
  
  const [localAdsCount, setLocalAdsCount] = useState(0);
  const [localRevenueCount, setLocalRevenueCount] = useState(0);
  
  // Synchronisation initiale des données
  useEffect(() => {
    if (userId && adsCount > 0) {
      setLocalAdsCount(adsCount);
      // Forcer la synchronisation des revenus
      setLocalRevenueCount(adsCount * CORRELATION_RATIO);
    }
  }, [adsCount, userId, CORRELATION_RATIO]);
  
  // Fonction de mise à jour synchronisée des compteurs avec corrélation parfaite
  const updateBothCounters = useCallback((adsIncrement: number, forceSync = false) => {
    const newAdsCount = localAdsCount + adsIncrement;
    // Calculer directement le revenu en fonction des publicités
    const newRevenueCount = newAdsCount * CORRELATION_RATIO;

    setLocalAdsCount(newAdsCount);
    setLocalRevenueCount(newRevenueCount);
    
    // Synchroniser avec les stats persistantes
    if (forceSync) {
      incrementStats(adsIncrement);
    }
  }, [localAdsCount, incrementStats, CORRELATION_RATIO]);
  
  useEffect(() => {
    if (!userId) return;
    
    // Gérer les événements de synchronisation
    const handleStatsSync = (event: CustomEvent) => {
      if (event.detail) {
        const { adsCount: syncedAdsCount } = event.detail;
        
        // S'assurer que les valeurs ne diminuent jamais
        if (syncedAdsCount > localAdsCount) {
          setLocalAdsCount(syncedAdsCount);
          // Calculer les revenus pour une synchronisation parfaite
          setLocalRevenueCount(syncedAdsCount * CORRELATION_RATIO);
        }
      }
    };
    
    window.addEventListener('stats:sync', handleStatsSync as EventListener);
    window.addEventListener('stats:update', handleStatsSync as EventListener);
    
    // Micro-incréments fréquents
    const microUpdateInterval = setInterval(() => {
      const microAdsIncrement = Math.floor(Math.random() * 2) + 1; // 1-2 ads
      updateBothCounters(microAdsIncrement);
    }, 2000); // Toutes les 2 secondes
    
    // Synchronisation forcée avec persistance
    const syncInterval = setInterval(() => {
      const smallAdsIncrement = Math.floor(Math.random() * 3) + 2; // 2-4 ads
      updateBothCounters(smallAdsIncrement, true);
    }, 5000); // Toutes les 5 secondes
    
    return () => {
      window.removeEventListener('stats:sync', handleStatsSync as EventListener);
      window.removeEventListener('stats:update', handleStatsSync as EventListener);
      clearInterval(microUpdateInterval);
      clearInterval(syncInterval);
    };
  }, [userId, localAdsCount, updateBothCounters, CORRELATION_RATIO]);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatisticCard
        title="Publicités analysées"
        value={userId ? localAdsCount : 0}
        icon={<Sparkles className="h-5 w-5" />}
        description="Annonces traitées par nos algorithmes"
      />
      <StatisticCard
        title="Revenus générés"
        value={userId ? localRevenueCount : 0}
        icon={<TrendingUp className="h-5 w-5" />}
        prefix=""
        suffix=" €"
        description="Revenus cumulés par notre système"
      />
    </div>
  );
};

export default StatisticsDisplay;
