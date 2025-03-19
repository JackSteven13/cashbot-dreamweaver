
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
  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-blue-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyLjEuOSAyLjEgMi4xdjI3LjhjMCAxLjItLjkgMi4xLTIuMSAyLjFIOFYxOGgyOHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA0Ii8+PC9nPjwvc3ZnPg==')] opacity-10"></div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white/90">Solde Actuel</h3>
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            Max {dailyLimit}€/jour
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-4xl font-bold">{displayBalance.toFixed(2)}€</span>
          {referralBonus > 0 && (
            <div className="bg-green-500/30 text-green-200 text-xs px-2 py-1 rounded-full flex items-center">
              <Sparkles className="h-3 w-3 mr-1" />
              +{referralBonus}%
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5">
            <div className="text-xs text-white/70 mb-1">Abonnement</div>
            <div className="font-medium capitalize">{subscription}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5">
            <div className="text-xs text-white/70 mb-1">Sessions</div>
            <div className="font-medium">{sessionsDisplay}</div>
          </div>
        </div>
        
        {referralCount > 0 && (
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5 flex justify-between items-center">
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
