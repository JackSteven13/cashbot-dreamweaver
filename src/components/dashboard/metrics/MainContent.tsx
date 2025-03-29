import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EarningsCard } from './index';
import { RevenueCalculator } from '@/components/dashboard';
// Correction: EliteBadge au lieu de AlphaBadge
import EliteBadge from '@/components/subscriptions/EliteBadge';

interface MainContentProps {
  balance: number;
  subscription: string;
  isNewUser: boolean;
  referrals?: any[];
  isTopReferrer?: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ 
  balance, 
  subscription,
  isNewUser,
  referrals,
  isTopReferrer
}) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Aperçu du compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <EarningsCard title="Solde actuel" amount={balance} />
            <EarningsCard title="Abonnement actuel" badge={subscription === 'elite' ? <EliteBadge /> : null} amount={subscription} />
            {isTopReferrer && <EarningsCard title="Top Parrain" amount="Félicitations !" />}
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
