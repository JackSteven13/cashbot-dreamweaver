
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, PieChart, ArrowUpRight } from 'lucide-react';
import { formatRevenue } from '@/utils/formatters';
import { calculateFutureGrowth } from '@/utils/forecast/growthProjection';

interface EarningsCardProps {
  balance: number;
  isNewUser: boolean;
  referralBonus?: number;
  subscription?: string;
}

const EarningsCard = ({ 
  balance, 
  isNewUser, 
  referralBonus = 0, 
  subscription = 'freemium' 
}: EarningsCardProps) => {
  // N'afficher que des valeurs nulles pour les nouveaux utilisateurs
  const displayBalance = isNewUser ? 0 : balance;
  const [projectedGrowth, setProjectedGrowth] = useState({
    oneMonth: 0,
    threeMonths: 0,
    twelveMonths: 0,
    daysToTarget: 0
  });
  
  // Calculer les projections de croissance selon l'abonnement
  useEffect(() => {
    if (!isNewUser) {
      const growth = calculateFutureGrowth(displayBalance, subscription);
      setProjectedGrowth(growth);
    }
  }, [displayBalance, subscription, isNewUser]);
  
  return (
    <Card className="shadow-md border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
          <span>Tableau de bord des gains</span>
          <span className="ml-auto text-sm font-normal text-slate-500 dark:text-slate-400 flex items-center">
            Croissance continue
            <ArrowUpRight className="h-4 w-4 text-green-500 ml-1" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Aujourd'hui</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {isNewUser ? "0€" : `+${formatRevenue(displayBalance)}`}
            </p>
            {!isNewUser && referralBonus > 0 && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Inclut bonus de parrainage: +{referralBonus}%
              </p>
            )}
          </div>
          <TrendingUp className="h-8 w-8 text-blue-500 dark:text-blue-400" />
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Ce mois (prévision)</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {isNewUser ? "0€" : `+${formatRevenue(projectedGrowth.oneMonth)}`}
            </p>
            {!isNewUser && (
              <p className="text-xs text-green-500 dark:text-green-400 mt-1 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Accumulation quotidienne
              </p>
            )}
          </div>
          <Calendar className="h-8 w-8 text-blue-500 dark:text-blue-400" />
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Projection à 3 mois</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {isNewUser ? "0€" : `+${formatRevenue(projectedGrowth.threeMonths)}`}
            </p>
            {!isNewUser && projectedGrowth.daysToTarget > 0 && (
              <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                {projectedGrowth.daysToTarget} jours vers l'indépendance financière
              </p>
            )}
          </div>
          <PieChart className="h-8 w-8 text-blue-500 dark:text-blue-400" />
        </div>
        
        {/* Nouvelle section pour l'inspiration financière */}
        <div className="mt-4 px-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            "La liberté financière n'est pas un rêve, c'est un plan. Votre plan est en action."
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsCard;
