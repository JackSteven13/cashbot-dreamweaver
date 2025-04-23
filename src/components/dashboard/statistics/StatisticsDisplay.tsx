
import React, { useEffect, useState } from 'react';
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
          {prefix}<AnimatedNumber value={value} duration={1200} formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} />{suffix}
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
    correlationRatio: 0.98 // Augmenté à 0.98 pour une synchronisation quasi 1:1
  });
  
  const [localAdsCount, setLocalAdsCount] = useState(0);
  const [localRevenueCount, setLocalRevenueCount] = useState(0);
  
  useEffect(() => {
    if (userId && adsCount > 0) {
      setLocalAdsCount(adsCount);
    }
    if (userId && revenueCount > 0) {
      setLocalRevenueCount(revenueCount);
    }
  }, [adsCount, revenueCount, userId]);
  
  useEffect(() => {
    if (!userId) return;
    
    // Micro-incréments beaucoup plus fréquents
    const microUpdateInterval = setInterval(() => {
      // Incréments beaucoup plus élevés et corrélés
      const microAdsIncrement = Math.floor(Math.random() * 25) + 18; // 18-42 pubs tous les 1 seconde
      const correlationFactor = 0.98 + Math.random() * 0.04; // 0.98-1.02 ratio (quasiment 1:1)
      const microRevenueIncrement = microAdsIncrement * correlationFactor;
      
      const newAdsCount = localAdsCount + microAdsIncrement;
      const newRevenueCount = localRevenueCount + microRevenueIncrement;

      setLocalAdsCount(newAdsCount);
      setLocalRevenueCount(newRevenueCount);
      
      // Synchroniser avec les stats persistantes plus souvent
      if (Math.random() > 0.7) { // 30% de chance de synchroniser à chaque mise à jour
        incrementStats(microAdsIncrement, microRevenueIncrement);
      }
      
    }, 1000); // Encore plus rapide: toutes les 1 secondes
    
    return () => clearInterval(microUpdateInterval);
  }, [userId, localAdsCount, localRevenueCount, incrementStats]);
  
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
