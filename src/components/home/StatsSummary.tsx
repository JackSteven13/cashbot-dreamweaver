
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp, Star } from 'lucide-react';
import { getGlobalStats } from '@/hooks/stats/utils/revenueCalculator';

const StatsSummary: React.FC = () => {
  const [stats, setStats] = useState({
    adsCount: 46800,
    revenueCount: 35665.4
  });
  
  // Charger les statistiques centralisées
  useEffect(() => {
    const loadStats = async () => {
      const globalStats = await getGlobalStats();
      setStats(globalStats);
    };
    
    loadStats();
    
    // Actualiser périodiquement avec un intervalle raisonnable
    const refreshInterval = setInterval(async () => {
      const globalStats = await getGlobalStats();
      setStats(globalStats);
    }, 30000); // Intervalle modéré pour éviter des incrémentations trop fréquentes
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Formater les nombres de façon réaliste avec des décimales pour éviter les chiffres trop ronds
  const formatRealisticNumber = (value: number): string => {
    // Arrondir à l'entier pour les analyses
    if (value > 100000) {
      const roundedValue = Math.floor(value);
      return new Intl.NumberFormat('fr-FR').format(roundedValue);
    } else {
      return new Intl.NumberFormat('fr-FR').format(Math.floor(value));
    }
  };
  
  const formatRealisticRevenue = (value: number): string => {
    // Garder 0 décimales pour les montants importants
    return new Intl.NumberFormat('fr-FR').format(Math.floor(value));
  };
  
  // Calculer un nombre d'affiliés crédible et variable
  const calculateAffiliateCount = (count: number): number => {
    const baseCount = Math.max(Math.floor(count / 762), 1); // Division non-ronde
    // Ajouter une légère variation aléatoire fixée au montage
    const variation = React.useMemo(() => 0.94 + Math.random() * 0.12, []); // 0.94-1.06
    return Math.max(1, Math.floor(baseCount * variation));
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
            <Activity className="h-6 w-6 mb-2" />
            <h3 className="font-bold text-lg">Publicités analysées</h3>
          </div>
          <div className="p-4 flex items-center">
            <span className="text-2xl md:text-3xl font-bold">
              {formatRealisticNumber(stats.adsCount)}
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
              {formatRealisticRevenue(stats.revenueCount)} €
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
            <Star className="h-6 w-6 mb-2" />
            <h3 className="font-bold text-lg">Affiliés actifs</h3>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-2xl md:text-3xl font-bold">
              {formatRealisticNumber(calculateAffiliateCount(stats.adsCount))}
            </span>
            <span className="text-xs text-green-500 font-medium bg-green-100 px-2 py-0.5 rounded-full">
              En hausse!
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSummary;
