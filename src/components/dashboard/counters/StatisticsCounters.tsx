
import React, { useEffect, useState } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import usePersistentStats from '@/hooks/stats/usePersistentStats';
import { useUserSession } from '@/hooks/useUserSession';

const StatisticsCounters: React.FC = () => {
  const { userData } = useUserSession();
  const userId = userData?.profile?.id;
  
  const { adsCount, revenueCount, incrementStats } = usePersistentStats({
    autoIncrement: true,
    userId: userId || 'anonymous', // Utiliser 'anonymous' comme fallback
    forceGrowth: true, // Assurer la croissance entre sessions
    correlationRatio: 0.75 // Assurer que les revenus augmentent proportionnellement aux publicités
  });
  
  // Valeurs locales pour des mises à jour plus fluides et fréquentes
  const [localAdsCount, setLocalAdsCount] = useState(0);
  const [localRevenueCount, setLocalRevenueCount] = useState(0);
  
  // Mettre à jour les valeurs locales quand les valeurs persistantes changent
  useEffect(() => {
    if (userId && adsCount > 0) {
      setLocalAdsCount(adsCount);
    }
    if (userId && revenueCount > 0) {
      setLocalRevenueCount(revenueCount);
    }
  }, [adsCount, revenueCount, userId]);

  // Incrémenter automatiquement les compteurs à intervalles réguliers
  useEffect(() => {
    if (!userId) return; // Ne pas mettre à jour pour les utilisateurs non authentifiés
    
    // Mises à jour très fréquentes (micro-incréments toutes les 5 secondes)
    const microUpdateInterval = setInterval(() => {
      // Très petits incréments fréquents
      const microAdsIncrement = Math.floor(Math.random() * 4) + 2; // 2-5 ads
      // Calculer revenu basé sur les publicités
      const correlationFactor = 0.75 * (0.95 + Math.random() * 0.1);
      const microRevenueIncrement = microAdsIncrement * correlationFactor;
      
      setLocalAdsCount(prev => prev + microAdsIncrement);
      setLocalRevenueCount(prev => prev + microRevenueIncrement);
    }, 5000); // Toutes les 5 secondes
    
    // Petits incréments fréquents - mise à jour persistante
    const minorUpdateInterval = setInterval(() => {
      // Petits incréments fréquents
      const smallAdsIncrement = Math.floor(Math.random() * 12) + 5;
      // Calculer le revenu basé sur le nombre de publicités analyées
      const correlationFactor = 0.75 * (0.98 + Math.random() * 0.04);
      const smallRevenueIncrement = smallAdsIncrement * correlationFactor;
      
      if (userId) {
        incrementStats(smallAdsIncrement, smallRevenueIncrement);
      }
    }, 15000); // Toutes les 15 secondes
    
    // Incréments plus importants moins fréquents
    const majorUpdateInterval = setInterval(() => {
      // Incréments plus importants moins fréquents
      const largerAdsIncrement = Math.floor(Math.random() * 80) + 40;
      // Calculer le revenu basé sur le nombre de publicités
      const correlationFactor = 0.76 * (0.97 + Math.random() * 0.06);
      const largerRevenueIncrement = largerAdsIncrement * correlationFactor;
      
      if (userId) {
        incrementStats(largerAdsIncrement, largerRevenueIncrement);
      }
    }, 90000); // Toutes les 1.5 minutes

    return () => {
      clearInterval(microUpdateInterval);
      clearInterval(minorUpdateInterval);
      clearInterval(majorUpdateInterval);
    };
  }, [incrementStats, userId]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="bg-blue-900/10 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-300">
          <AnimatedNumber 
            value={userId ? localAdsCount : 0} 
            duration={1500} 
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
        </div>
        <p className="text-sm md:text-base mt-2 text-blue-800 dark:text-blue-400">Publicités analysées</p>
      </div>

      <div className="bg-emerald-900/10 dark:bg-emerald-900/20 rounded-lg p-6 text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 dark:text-emerald-300">
          <AnimatedNumber 
            value={userId ? localRevenueCount : 0} 
            duration={1500} 
            formatValue={(value) => Math.floor(value).toLocaleString('fr-FR')} 
          />
          <span className="ml-1">€</span>
        </div>
        <p className="text-sm md:text-base mt-2 text-emerald-800 dark:text-emerald-400">Revenus générés</p>
      </div>
    </div>
  );
};

export default StatisticsCounters;
