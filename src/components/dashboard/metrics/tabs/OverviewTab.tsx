
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, Clock, ArrowUpRight, ChevronDown } from 'lucide-react';
import { formatRevenue } from '@/utils/formatters';
import EliteBadge from '@/components/subscriptions/EliteBadge';

interface OverviewTabProps {
  subscription: string;
  dailySessionCount: number;
  isTopReferrer?: boolean;
  referralCount: number;
  referralBonus: number;
  isNewUser: boolean;
  balance: number;
  handleStartSession?: () => void;
  handleWithdrawal?: () => void;
  canStartSession?: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  subscription,
  dailySessionCount,
  isTopReferrer = false,
  referralCount,
  referralBonus,
  isNewUser,
  balance,
  handleStartSession,
  handleWithdrawal,
  canStartSession = true
}) => {
  // Convert any "alpha" subscription to "starter"
  const displaySubscription = subscription === "alpha" ? "starter" : subscription;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="shadow-md border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Abonnement actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-800 dark:text-gray-200 mr-2">
                {displaySubscription.charAt(0).toUpperCase() + displaySubscription.slice(1)}
              </span>
              {displaySubscription === 'elite' && <EliteBadge />}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Sessions aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {dailySessionCount}
              </div>
              <Clock className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        {isTopReferrer && (
          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Top Parrain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                Félicitations !
              </div>
            </CardContent>
          </Card>
        )}
        
        {!isTopReferrer && (
          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Parrainages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {referralCount}
                </div>
                <div className="text-sm text-green-600">
                  {referralBonus > 0 ? `+${referralBonus}% bonus` : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
        <Card className="shadow-md border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Revenus récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Aujourd'hui</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +{formatRevenue(isNewUser ? 0 : balance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Cette semaine</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +{formatRevenue(isNewUser ? 0 : balance * 1.5)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Ce mois</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +{formatRevenue(isNewUser ? 0 : balance * 3)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={handleStartSession}
                disabled={!canStartSession || isNewUser}
              >
                Lancer une session
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleWithdrawal}
                disabled={balance < 100 || isNewUser}
              >
                Effectuer un retrait
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
