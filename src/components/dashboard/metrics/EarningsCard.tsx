
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, PieChart } from 'lucide-react';
import { formatRevenue } from '@/utils/formatters';

interface EarningsCardProps {
  balance: number;
  isNewUser: boolean;
  referralBonus?: number;
}

const EarningsCard = ({ balance, isNewUser, referralBonus = 0 }: EarningsCardProps) => {
  // N'afficher que des valeurs nulles pour les nouveaux utilisateurs
  const displayBalance = isNewUser ? 0 : balance;
  
  return (
    <Card className="shadow-md border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          Tableau de bord des gains
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Aujourd'hui</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {isNewUser ? "0€" : `+${formatRevenue(displayBalance)}`}
            </p>
            {!isNewUser && referralBonus > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Inclut bonus de parrainage: +{referralBonus}%
              </p>
            )}
          </div>
          <TrendingUp className="h-8 w-8 text-blue-500 dark:text-blue-400" />
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Cette semaine</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {isNewUser ? "0€" : `+${formatRevenue(displayBalance * 1.5)}`}
            </p>
          </div>
          <Calendar className="h-8 w-8 text-blue-500 dark:text-blue-400" />
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Ce mois</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {isNewUser ? "0€" : `+${formatRevenue(displayBalance * 3)}`}
            </p>
          </div>
          <PieChart className="h-8 w-8 text-blue-500 dark:text-blue-400" />
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsCard;
