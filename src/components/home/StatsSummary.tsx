
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp } from 'lucide-react';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';
import { initStatsSync } from '@/utils/stats/statsSynchronizer';

const StatsSummary: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  
  const { adsCount, revenueCount } = usePersistentStats({
    autoIncrement: true
  });
  
  // Initialiser la synchronisation des statistiques
  useEffect(() => {
    const cleanup = initStatsSync(userId);
    return cleanup;
  }, [userId]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
            <Activity className="h-6 w-6 mb-2" />
            <h3 className="font-bold text-lg">Publicités analysées</h3>
          </div>
          <div className="p-4 flex items-center">
            <span className="text-2xl md:text-3xl font-bold">
              {new Intl.NumberFormat('fr-FR').format(Math.round(adsCount))}
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
            <TrendingUp className="h-6 w-6 mb-2" />
            <h3 className="font-bold text-lg">Revenus générés</h3>
          </div>
          <div className="p-4 flex items-center">
            <span className="text-2xl md:text-3xl font-bold">
              {new Intl.NumberFormat('fr-FR').format(Math.round(revenueCount))} €
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSummary;
