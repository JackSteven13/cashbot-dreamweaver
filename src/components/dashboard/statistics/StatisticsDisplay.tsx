
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
          {prefix}<AnimatedNumber value={value} duration={800} formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} />{suffix}
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
  
  const { adsCount, revenueCount, incrementStats } = usePersistentStats({
    autoIncrement: true,
    userId: userId || 'anonymous',
    forceGrowth: true,
    correlationRatio: 0.999 // Maintenir une parfaite synchronisation
  });
  
  const [localAdsCount, setLocalAdsCount] = useState(0);
  const [localRevenueCount, setLocalRevenueCount] = useState(0);
  
  // Synchronisation initiale des données
  useEffect(() => {
    if (userId && adsCount > 0) {
      setLocalAdsCount(adsCount);
    }
    if (userId && revenueCount > 0) {
      setLocalRevenueCount(revenueCount);
    }
  }, [adsCount, revenueCount, userId]);
  
  // Fonction de mise à jour synchronisée des compteurs
  const updateBothCounters = useCallback((adsIncrement: number, forceSync = false) => {
    const correlationFactor = 1.001 + (Math.random() * 0.002); // Entre 1.001 et 1.003 pour garantir que les revenus augmentent
    const revenueIncrement = adsIncrement * correlationFactor;
    
    const newAdsCount = localAdsCount + adsIncrement;
    const newRevenueCount = localRevenueCount + revenueIncrement;

    setLocalAdsCount(newAdsCount);
    setLocalRevenueCount(newRevenueCount);
    
    // Synchroniser avec les stats persistantes
    if (forceSync || Math.random() > 0.5) { // 50% de chance de synchroniser à chaque mise à jour
      incrementStats(adsIncrement, revenueIncrement);
    }
    
    // Émettre un événement pour synchroniser tous les compteurs de l'application
    window.dispatchEvent(new CustomEvent('stats:counters:updated', {
      detail: { 
        adsCount: newAdsCount, 
        revenueCount: newRevenueCount 
      }
    }));
  }, [localAdsCount, localRevenueCount, incrementStats]);
  
  useEffect(() => {
    if (!userId) return;
    
    // Micro-incréments plus fréquents
    const microUpdateInterval = setInterval(() => {
      // Incréments variés, mais toujours avec une corrélation parfaite
      const microAdsIncrement = Math.floor(Math.random() * 20) + 15; // 15-34 pubs toutes les 500ms
      updateBothCounters(microAdsIncrement);
      
    }, 400); // Encore plus rapide: toutes les 400ms
    
    // Synchronisation forcée toutes les 2 secondes
    const syncInterval = setInterval(() => {
      if (userId) {
        // Synchroniser avec les stats persistantes
        incrementStats(0, 0);
      }
    }, 2000);
    
    return () => {
      clearInterval(microUpdateInterval);
      clearInterval(syncInterval);
    };
  }, [userId, updateBothCounters, incrementStats]);
  
  // Écouter les événements de synchronisation
  useEffect(() => {
    const handleStatsSync = (event: CustomEvent) => {
      if (event.detail) {
        const { adsCount: syncedAdsCount, revenueCount: syncedRevenueCount } = event.detail;
        
        // S'assurer que les valeurs ne diminuent jamais
        if (syncedAdsCount > localAdsCount) {
          setLocalAdsCount(syncedAdsCount);
        }
        if (syncedRevenueCount > localRevenueCount) {
          setLocalRevenueCount(syncedRevenueCount);
        }
      }
    };
    
    window.addEventListener('stats:sync', handleStatsSync as EventListener);
    window.addEventListener('stats:update', handleStatsSync as EventListener);
    
    return () => {
      window.removeEventListener('stats:sync', handleStatsSync as EventListener);
      window.removeEventListener('stats:update', handleStatsSync as EventListener);
    };
  }, [localAdsCount, localRevenueCount]);
  
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
