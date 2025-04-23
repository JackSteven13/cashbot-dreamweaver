
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
  
  // S'assurer que l'ID utilisateur est toujours passé au hook
  const { adsCount, revenueCount } = usePersistentStats({
    autoIncrement: true,
    userId: userId || 'anonymous', // Utiliser 'anonymous' comme fallback mais ne devrait jamais arriver
    forceGrowth: true,
    correlationRatio: 0.75
  });
  
  // État local pour des mises à jour plus fréquentes et fluides
  const [localAdsCount, setLocalAdsCount] = useState(0);
  const [localRevenueCount, setLocalRevenueCount] = useState(0);
  
  // Synchroniser avec les valeurs persistantes uniquement si l'utilisateur a un ID
  useEffect(() => {
    if (userId && adsCount > 0) {
      setLocalAdsCount(adsCount);
    }
    if (userId && revenueCount > 0) {
      setLocalRevenueCount(revenueCount);
    }
  }, [adsCount, revenueCount, userId]);
  
  // Ajouter des micro-mises à jour fréquentes seulement si l'utilisateur est identifié
  useEffect(() => {
    if (!userId) return; // Ne pas mettre à jour pour les utilisateurs non identifiés
    
    const microUpdateInterval = setInterval(() => {
      const microAdsIncrement = Math.floor(Math.random() * 3) + 2; // 2-4 ads toutes les 5 secondes
      // Calculer revenu basé sur les publicités avec léger bruit
      const correlationFactor = 0.75 * (0.95 + Math.random() * 0.1);
      const microRevenueIncrement = microAdsIncrement * correlationFactor;
      
      setLocalAdsCount(prev => prev + microAdsIncrement);
      setLocalRevenueCount(prev => prev + microRevenueIncrement);
    }, 5000);
    
    return () => clearInterval(microUpdateInterval);
  }, [userId]);
  
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
