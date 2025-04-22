
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
  
  // Utiliser notre hook de statistiques persistantes avec synchronisation entre publicités et revenus
  const { adsCount, revenueCount } = usePersistentStats({
    autoIncrement: true,
    userId,
    // Ajout d'un paramètre forceGrowth pour assurer l'évolution entre les sessions
    forceGrowth: true,
    // Assurer la corrélation entre publicités et revenus
    correlationRatio: 0.75
  });
  
  // État local pour des mises à jour plus fréquentes et fluides
  const [localAdsCount, setLocalAdsCount] = useState(adsCount);
  const [localRevenueCount, setLocalRevenueCount] = useState(revenueCount);
  
  // Synchroniser avec les valeurs persistantes
  useEffect(() => {
    if (adsCount > 0) {
      setLocalAdsCount(adsCount);
    }
    if (revenueCount > 0) {
      setLocalRevenueCount(revenueCount);
    }
  }, [adsCount, revenueCount]);
  
  // Ajouter des micro-mises à jour fréquentes
  useEffect(() => {
    const microUpdateInterval = setInterval(() => {
      const microAdsIncrement = Math.floor(Math.random() * 3) + 2; // 2-4 ads toutes les 5 secondes
      // Calculer revenu basé sur les publicités avec léger bruit
      const correlationFactor = 0.75 * (0.95 + Math.random() * 0.1);
      const microRevenueIncrement = microAdsIncrement * correlationFactor;
      
      setLocalAdsCount(prev => prev + microAdsIncrement);
      setLocalRevenueCount(prev => prev + microRevenueIncrement);
    }, 5000);
    
    return () => clearInterval(microUpdateInterval);
  }, []);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatisticCard
        title="Publicités analysées"
        value={localAdsCount}
        icon={<Sparkles className="h-5 w-5" />}
        description="Annonces traitées par nos algorithmes"
      />
      <StatisticCard
        title="Revenus générés"
        value={localRevenueCount}
        icon={<TrendingUp className="h-5 w-5" />}
        prefix=""
        suffix=" €"
        description="Revenus cumulés par notre système"
      />
    </div>
  );
};

export default StatisticsDisplay;
