
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EarningsCard } from './index';
import RevenueCalculator from '@/components/dashboard/RevenueCalculator';
import EliteBadge from '@/components/subscriptions/EliteBadge';

interface MainContentProps {
  balance: number;
  subscription: string;
  isNewUser: boolean;
  referrals?: any[];
  isTopReferrer?: boolean;
  canStartSession?: boolean;
  dailySessionCount?: number;
  referralCount?: number;
  referralBonus?: number;
  handleStartSession?: () => void;
  handleWithdrawal?: () => void;
  transactions?: any[];
}

const MainContent: React.FC<MainContentProps> = ({ 
  balance, 
  subscription,
  isNewUser,
  referrals,
  isTopReferrer,
  referralCount = 0,
  referralBonus = 0
}) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Aperçu du compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <EarningsCard 
              balance={balance} 
              isNewUser={isNewUser}
              referralBonus={referralBonus} 
            />
            
            <Card className="shadow-md border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  Abonnement actuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-800 dark:text-gray-200 mr-2">
                    {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
                  </span>
                  {subscription === 'elite' && <EliteBadge />}
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
          </div>
        </CardContent>
      </Card>
      
      <RevenueCalculator 
        currentSubscription={subscription} 
        isNewUser={isNewUser}
      />
    </div>
  );
};

export default MainContent;
