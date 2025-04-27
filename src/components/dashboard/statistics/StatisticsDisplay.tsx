
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const CORRELATION_RATIO = 0.76203;
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // S'assurer que nous utilisons l'ID de l'utilisateur pour obtenir des statistiques spécifiques
  const { adsCount: baseAdsCount, revenueCount: baseRevenueCount } = usePersistentStats({
    autoIncrement: false,
    userId: userId || 'anonymous', // Clé pour isoler les données par utilisateur
    forceGrowth: true,
    correlationRatio: CORRELATION_RATIO
  });

  // Compteurs locaux qui progressent lentement et asymétriquement
  const [localAdsCount, setLocalAdsCount] = useState(baseAdsCount);
  const [localRevenueCount, setLocalRevenueCount] = useState(baseRevenueCount);

  // Synchronize with mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Memoize the rate calculation to prevent recreating on each render
  const getUserSpecificRate = useCallback(() => {
    if (!userId) return 10000;
    return (userId.charCodeAt(0) % 6 + 8) * 1000; // Entre 8 et 14 secondes basé sur l'ID utilisateur
  }, [userId]);

  // Rafraîchit la base lorsque les données de base changent
  useEffect(() => {
    if (userId && isMountedRef.current) {
      setLocalAdsCount(baseAdsCount);
      setLocalRevenueCount(baseRevenueCount);
    }
  }, [baseAdsCount, baseRevenueCount, userId]);

  // Progression différente pour chaque utilisateur
  useEffect(() => {
    if (!userId || !isMountedRef.current) return;
    
    // Clean up any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    // Générer un taux spécifique à l'utilisateur pour éviter que tous les comptes progressent au même rythme
    const userSpecificRate = getUserSpecificRate();
    
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      setLocalAdsCount(prev => {
        const adsRand = Math.random();
        let adsIncrement = 0;
        if (adsRand > 0.94) adsIncrement = 2;
        else if (adsRand > 0.80) adsIncrement = 1;
        return Math.min(prev + adsIncrement, 152847); // Capped at max value
      });
      
      setLocalRevenueCount(prev => {
        const revenueRand = Math.random();
        let revenueIncrement = 0;
        if (revenueRand > 0.92) {
          const sessionVariation = userId ? 
            (userId.charCodeAt(0) % 10 - 5) / 1000 : 0;
          const jitterRatio = CORRELATION_RATIO + ((Math.random() - 0.5) * 0.025) + sessionVariation;
          revenueIncrement = 1 * jitterRatio;
        }
        return Math.min(prev + revenueIncrement, 116329); // Capped at max value
      });
    }, userSpecificRate);
    
    // Store the interval reference
    updateIntervalRef.current = interval;
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [userId, getUserSpecificRate, CORRELATION_RATIO]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
      <StatisticCard
        title="Publicités analysées"
        value={localAdsCount}
        icon={<Sparkles className="h-5 w-5" />}
        suffix=" pubs"
      />
      <StatisticCard
        title="Revenus générés"
        value={localRevenueCount}
        icon={<TrendingUp className="h-5 w-5" />}
        prefix="€"
      />
    </div>
  );
};

export default StatisticsDisplay;
