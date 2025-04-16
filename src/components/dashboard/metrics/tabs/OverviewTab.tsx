import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, Clock, ArrowUpRight, ChevronDown } from 'lucide-react';
import { formatRevenue } from '@/utils/formatters';
import EliteBadge from '@/components/subscriptions/EliteBadge';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface OverviewTabProps {
  subscription: string;
  dailySessionCount: number;
  isTopReferrer?: boolean;
  referralCount: number;
  referralBonus: number;
  isNewUser: boolean;
  balance: number;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  subscription,
  dailySessionCount,
  isTopReferrer = false,
  referralCount,
  referralBonus,
  isNewUser,
  balance
}) => {
  // Convert any "alpha" subscription to "starter"
  const displaySubscription = subscription === "alpha" ? "starter" : subscription;

  // Calculer les revenus en fonction des limites d'abonnement
  const calculateRevenueForDisplay = () => {
    // Obtenir la limite quotidienne basée sur l'abonnement
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Pour un nouvel utilisateur ou si le solde est inférieur à la limite, on retourne 0
    if (isNewUser || balance <= 0) return { today: 0, week: 0, month: 0 };
    
    // Pour les comptes freemium, respecter strictement la limite de 0.50€ par jour
    if (subscription === 'freemium') {
      const today = Math.min(balance, dailyLimit);
      const week = Math.min(dailyLimit * 5, balance * 1.2); // Max 5 jours à 0.50€
      const month = Math.min(dailyLimit * 20, balance * 2); // Max 20 jours à 0.50€
      
      return { today, week, month };
    }
    
    // Pour les autres abonnements, garder le comportement actuel mais avec des limites plus réalistes
    return {
      today: Math.min(balance, dailyLimit),
      week: Math.min(balance * 1.5, dailyLimit * 5),
      month: Math.min(balance * 3, dailyLimit * 20)
    };
  };
  
  // Obtenir les revenus calculés
  const revenues = calculateRevenueForDisplay();

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
              <div className="text-xl font-bold text-blue-500 dark:text-blue-400">
                Félicitations !
              </div>
            </CardContent>
          </Card>
        )}
        
        {!isTopReferrer && (
          <Card className="shadow-md border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Affiliations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {referralCount}
                </div>
                <div className="text-sm text-blue-500">
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
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  +{formatRevenue(revenues.today)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Cette semaine</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  +{formatRevenue(revenues.week)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Ce mois</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  +{formatRevenue(revenues.month)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Niveau
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Sessions totales
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {dailySessionCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Affiliations
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {referralCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
