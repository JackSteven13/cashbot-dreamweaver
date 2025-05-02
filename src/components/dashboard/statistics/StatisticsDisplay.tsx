
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { getGlobalStats } from '@/hooks/stats/utils/revenueCalculator';
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
          {prefix}<AnimatedNumber value={value} duration={1500} formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} />{suffix}
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
  
  const [stats, setStats] = useState({
    adsCount: 46800,
    revenueCount: 35665.4
  });
  
  // Charger les statistiques centralisées
  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;
      
      const globalStats = await getGlobalStats();
      setStats(globalStats);
    };
    
    loadStats();
    
    // Actualiser périodiquement avec un intervalle raisonnable
    // pour éviter les changements trop fréquents ou trop importants
    const refreshInterval = setInterval(async () => {
      if (!userId) return;
      
      const globalStats = await getGlobalStats();
      setStats(globalStats);
    }, 45000); // Intervalle plus long pour des changements plus naturels
    
    return () => clearInterval(refreshInterval);
  }, [userId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatisticCard
        title="Publicités analysées"
        value={userId ? stats.adsCount : 0}
        icon={<Sparkles className="h-5 w-5" />}
        description="Annonces traitées par nos algorithmes"
      />
      <StatisticCard
        title="Revenus générés"
        value={userId ? stats.revenueCount : 0}
        icon={<TrendingUp className="h-5 w-5" />}
        prefix=""
        suffix=" €"
        description="Revenus cumulés par notre système"
      />
    </div>
  );
};

export default StatisticsDisplay;
