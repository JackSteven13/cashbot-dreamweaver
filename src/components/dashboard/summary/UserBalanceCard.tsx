
import React from 'react';
import { Sparkles, Users } from 'lucide-react';

interface UserBalanceCardProps {
  displayBalance: number;
  subscription: string;
  dailyLimit: number;
  sessionsDisplay: string;
  referralCount?: number;
  referralBonus?: number;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  displayBalance,
  subscription,
  dailyLimit,
  sessionsDisplay,
  referralCount = 0,
  referralBonus = 0
}) => {
  // Formater l'affichage de l'abonnement avec une majuscule
  const formattedSubscription = subscription === 'alpha' 
    ? 'Alpha Premium' 
    : subscription.charAt(0).toUpperCase() + subscription.slice(1);
    
  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white/90">Solde Actuel</h3>
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            Max {dailyLimit}€/jour
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-bold">{displayBalance.toFixed(2)}€</span>
          {referralBonus > 0 && (
            <div className="bg-green-500/30 text-green-200 text-xs px-2 py-1 rounded-full flex items-center">
              <Sparkles className="h-3 w-3 mr-1" />
              +{referralBonus}%
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className={`${subscription === 'alpha' ? 'bg-violet-800/50' : 'bg-slate-800/70'} backdrop-blur-sm rounded-lg p-3 border ${subscription === 'alpha' ? 'border-purple-500/30' : 'border-white/5'}`}>
            <div className="text-xs text-white/70 mb-1">Abonnement</div>
            <div className="font-medium">{formattedSubscription}</div>
          </div>
          
          <div className="bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5">
            <div className="text-xs text-white/70 mb-1">Sessions</div>
            <div className="font-medium">{sessionsDisplay}</div>
          </div>
        </div>
        
        {referralCount > 0 && (
          <div className="mt-4 bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 flex justify-between items-center">
            <div>
              <div className="text-xs text-white/70 mb-1">Filleuls actifs</div>
              <div className="font-medium">{referralCount}</div>
            </div>
            <Users className="h-5 w-5 text-white/70" />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBalanceCard;
