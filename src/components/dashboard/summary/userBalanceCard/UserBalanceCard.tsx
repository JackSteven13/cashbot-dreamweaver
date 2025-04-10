import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import ProgressBar from './components/ProgressBar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserBalanceCardProps {
  balance: number;
  isNewUser?: boolean;
  subscription?: string;
  dailyLimit?: number;
  referralCount?: number;
  referralBonus?: number;
  withdrawalThreshold?: number;
}

const UserBalanceCard = ({
  balance = 0,
  isNewUser = false,
  subscription = 'freemium',
  dailyLimit = 0.5,
  referralCount = 0,
  referralBonus = 0,
  withdrawalThreshold
}: UserBalanceCardProps) => {
  const BalanceDisplay = ({ balance, isNewUser }: { balance: number; isNewUser?: boolean }) => (
    <div className="text-3xl font-semibold tracking-tight">
      {isNewUser ? '0.00' : balance.toFixed(2)}€
    </div>
  );
  
  const GainsDisplay = ({ showGains, referralBonus }: { showGains: boolean; referralBonus?: number }) => (
    showGains ? (
      <div className="flex items-center text-sm font-medium opacity-75 mt-1">
        <Sparkles className="mr-1 h-4 w-4" />
        Gains: {(balance - referralBonus).toFixed(2)}€ (+{referralBonus.toFixed(2)}€ parrainage)
      </div>
    ) : null
  );
  
  const ReferralInfo = ({ referralCount }: { referralCount: number }) => (
    <div className="text-xs opacity-60 mt-2">
      {referralCount} filleul{referralCount !== 1 ? 's' : ''} actif{referralCount !== 1 ? 's' : ''}
    </div>
  );
  
  const SubscriptionInfo = ({ subscription }: { subscription: string }) => {
    const getSubscriptionLabel = (sub: string) => {
      switch (sub) {
        case 'freemium': return 'Gratuit';
        case 'starter': return 'Starter';
        case 'gold': return 'Gold';
        case 'elite': return 'Elite';
        default: return 'Inconnu';
      }
    };
    
    const lastActive = localStorage.getItem('lastActive');
    const formattedDate = lastActive ? format(new Date(lastActive), 'dd MMMM yyyy', { locale: fr }) : null;
    
    return (
      <div className="flex items-center justify-between text-xs opacity-60 mt-2">
        <span>Abonnement: {getSubscriptionLabel(subscription)}</span>
        {formattedDate && <span>Dernière activité: {formattedDate}</span>}
      </div>
    );
  };
  
  return (
    <Card className="bg-[#121723] text-white border-none overflow-hidden relative">
      <CardHeader className="px-4 pt-4 pb-0">
        <CardTitle className="text-base">
          Solde disponible
          {isNewUser && (
            <Badge variant="secondary" className="ml-2">
              Nouveau
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <BalanceDisplay balance={balance} isNewUser={isNewUser} />
        <GainsDisplay showGains={!isNewUser && balance > 0} referralBonus={referralBonus} />
        <ProgressBar 
          displayBalance={balance} 
          subscription={subscription} 
          withdrawalThreshold={withdrawalThreshold}
        />
        <ReferralInfo referralCount={referralCount} />
        <SubscriptionInfo subscription={subscription} />
      </CardContent>
    </Card>
  );
};

export default UserBalanceCard;
