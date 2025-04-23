
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';
import { synchronizeRevenueWithAds } from '@/hooks/stats/utils/revenueCalculator';

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
  const { adsCount: baseAdsCount, revenueCount: baseRevenueCount, incrementStats } = usePersistentStats({
    autoIncrement: false,
    userId: userId || 'anonymous', // Clé pour isoler les données par utilisateur
    forceGrowth: true,
    correlationRatio: CORRELATION_RATIO
  });

  // Compteurs locaux qui progressent lentement et asymétriquement
  const [localAdsCount, setLocalAdsCount] = useState(baseAdsCount);
  const [localRevenueCount, setLocalRevenueCount] = useState(baseRevenueCount);

  // Rafraîchit la base lorsque les données de base changent
  useEffect(() => {
    if (userId) {
      console.log(`StatisticsDisplay: Synchronisation avec userId=${userId}, ads=${baseAdsCount}, revenue=${baseRevenueCount}`);
      setLocalAdsCount(baseAdsCount);
      
      // IMPORTANT: Toujours recalculer les revenus à partir des pubs pour assurer la cohérence
      const syncedRevenue = synchronizeRevenueWithAds(baseAdsCount);
      setLocalRevenueCount(syncedRevenue);
    }
  }, [baseAdsCount, baseRevenueCount, userId]);

  // Progression différente pour chaque utilisateur
  useEffect(() => {
    if (!userId) return;
    
    // Générer un taux spécifique à l'utilisateur pour éviter que tous les comptes progressent au même rythme
    const userSpecificRate = userId ? 
      (userId.charCodeAt(0) % 6 + 4) * 1000 : // Entre 4 et 10 secondes basé sur l'ID utilisateur - Plus rapide pour être visible
      8000;
    
    const updateInterval = setInterval(() => {
      setLocalAdsCount(prev => {
        const adsRand = Math.random();
        let adsIncrement = 0;
        if (adsRand > 0.80) adsIncrement = 2; // Augmenté la probabilité d'incrément
        else if (adsRand > 0.55) adsIncrement = 1;
        // La plupart du temps pas d'évolution
        const nextAds = prev + adsIncrement;
        
        // Si les pubs ont augmenté, mettre à jour les revenus aussi
        if (adsIncrement > 0) {
          // IMPORTANT: Recalculer les revenus en fonction des pubs pour maintenir le ratio
          const nextRevenue = synchronizeRevenueWithAds(nextAds);
          setLocalRevenueCount(nextRevenue);
          
          // Déclencher un événement pour informer les autres composants
          window.dispatchEvent(new CustomEvent('stats:update', { 
            detail: { 
              adsCount: nextAds,
              revenueCount: nextRevenue,
              increment: {
                ads: adsIncrement,
                revenue: nextRevenue - localRevenueCount
              }
            }
          }));
        }
        
        return nextAds;
      });
    }, userSpecificRate + Math.floor(Math.random() * 3000)); // Variation réduite dans l'intervalle pour plus de régularité

    return () => clearInterval(updateInterval);
  }, [userId, localRevenueCount]);

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
