
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, PieChart } from 'lucide-react';

interface EarningsCardProps {
  balance: number;
  isNewUser: boolean;
  referralBonus?: number;
}

const EarningsCard = ({ balance, isNewUser, referralBonus = 0 }: EarningsCardProps) => {
  return (
    <Card className="shadow-md border-slate-200 dark:border-slate-700 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-800 to-blue-900 text-white">
        <CardTitle className="text-xl font-semibold">
          Tableau de bord des gains
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-800/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Aujourd'hui</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
              {isNewUser ? "0.00€" : `+${balance.toFixed(2)}€`}
            </p>
            {referralBonus > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Inclut bonus de parrainage: +{referralBonus}%
              </p>
            )}
          </div>
          <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-800/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Cette semaine</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
              {isNewUser ? "0.00€" : `+${(balance * 1.5).toFixed(2)}€`}
            </p>
          </div>
          <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
            <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-800/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Ce mois</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
              {isNewUser ? "0.00€" : `+${(balance * 3).toFixed(2)}€`}
            </p>
          </div>
          <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
            <PieChart className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsCard;
