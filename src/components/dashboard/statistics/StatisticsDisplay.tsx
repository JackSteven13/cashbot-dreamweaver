
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
  const CORRELATION_RATIO = 0.76203;

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

  // Memoize the rate calculation to prevent recreating on each render
  const getUserSpecificRate = useCallback(() => {
    if (!userId) return 10000;
    return (userId.charCodeAt(0) % 6 + 8) * 1000; // Entre 8 et 14 secondes basé sur l'ID utilisateur
  }, [userId]);

  // Rafraîchit la base lorsque les données de base changent
  useEffect(() => {
    if (userId) {
      console.log(`StatisticsDisplay: Synchronisation avec userId=${userId}, ads=${baseAdsCount}, revenue=${baseRevenueCount}`);
      setLocalAdsCount(baseAdsCount);
      setLocalRevenueCount(baseRevenueCount);
    }
  }, [baseAdsCount, baseRevenueCount, userId]);

  // Progression différente pour chaque utilisateur
  useEffect(() => {
    if (!userId) return;
    
    // Générer un taux spécifique à l'utilisateur pour éviter que tous les comptes progressent au même rythme
    const userSpecificRate = getUserSpecificRate();
    
    const updateInterval = setInterval(() => {
      setLocalAdsCount(prev => {
        const adsRand = Math.random();
        let adsIncrement = 0;
        if (adsRand > 0.94) adsIncrement = 2;
        else if (adsRand > 0.80) adsIncrement = 1;
        // La plupart du temps pas d'évolution
        const nextAds = prev + adsIncrement;
        return nextAds;
      });
      
      setLocalRevenueCount(prevRev => {
        // Ne fait progresser que si les pubs avancent, mais peut parfois rattraper en bloc
        const revenueRand = Math.random();
        let revInc = 0;
        if (revenueRand > 0.8) {
          // Décorrélation douce du ratio attendu avec variation basée sur l'ID utilisateur
          const userVariation = userId ? (userId.charCodeAt(0) % 10) / 200 : 0; // Petite variation par utilisateur
          revInc = (Math.random() * 2 + 0.4) * (CORRELATION_RATIO + ((Math.random() - 0.5) * 0.03) + userVariation);
        }
        return prevRev + revInc;
      });
    }, userSpecificRate + Math.floor(Math.random() * 6000)); // Variation supplémentaire dans l'intervalle

    return () => clearInterval(updateInterval);
  }, [userId, getUserSpecificRate]);

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
