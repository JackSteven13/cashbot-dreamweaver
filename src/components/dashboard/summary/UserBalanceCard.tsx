
import React from 'react';
import { Sparkles, Users, Bot, Network } from 'lucide-react';
import { WITHDRAWAL_THRESHOLDS } from '@/components/dashboard/summary/constants';

interface UserBalanceCardProps {
  displayBalance: number;
  subscription: string;
  dailyLimit: number;
  sessionsDisplay: string;
  referralCount?: number;
  referralBonus?: number;
  networkGains?: number;
  botGains?: number;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  displayBalance,
  subscription,
  dailyLimit,
  sessionsDisplay,
  referralCount = 0,
  referralBonus = 0,
  networkGains = 0,
  botGains = 0
}) => {
  // Calculate how close we are to the withdrawal threshold
  const withdrawalThreshold = WITHDRAWAL_THRESHOLDS[subscription as keyof typeof WITHDRAWAL_THRESHOLDS] || 200;
  const progressPercentage = Math.min(Math.floor((displayBalance / withdrawalThreshold) * 100), 95);
  const isNearThreshold = progressPercentage >= 90;
  
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
        
        {/* Progress bar towards withdrawal threshold */}
        <div className="mt-3 mb-1">
          <div className="w-full bg-slate-700/70 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${isNearThreshold ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>{progressPercentage}%</span>
            <span>Seuil: {withdrawalThreshold}€</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5">
            <div className="text-xs text-white/70 mb-1">Abonnement</div>
            <div className="font-medium capitalize">{subscription}</div>
          </div>
          
          <div className="bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5">
            <div className="text-xs text-white/70 mb-1">Sessions</div>
            <div className="font-medium">{sessionsDisplay}</div>
          </div>
        </div>
        
        {/* Separate network gains vs bot gains */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-emerald-900/20 backdrop-blur-sm rounded-lg p-3 border border-emerald-800/30 flex justify-between items-center">
            <div>
              <div className="text-xs text-white/70 mb-1 flex items-center">
                <Network className="h-3 w-3 mr-1 text-emerald-400" />
                Gains réseau
              </div>
              <div className="font-medium text-emerald-300">{networkGains.toFixed(2)}€</div>
            </div>
          </div>
          
          <div className="bg-blue-900/20 backdrop-blur-sm rounded-lg p-3 border border-blue-800/30 flex justify-between items-center">
            <div>
              <div className="text-xs text-white/70 mb-1 flex items-center">
                <Bot className="h-3 w-3 mr-1 text-blue-400" />
                Gains bots
              </div>
              <div className="font-medium text-blue-300">{botGains.toFixed(2)}€</div>
            </div>
          </div>
        </div>
        
        {referralCount > 0 ? (
          <div className="mt-4 bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 flex justify-between items-center">
            <div>
              <div className="text-xs text-white/70 mb-1">Filleuls actifs</div>
              <div className="font-medium flex items-center">
                {referralCount} {referralCount > 1 ? 'personnes' : 'personne'}
                <span className="text-green-400 ml-2 text-xs">(+{referralBonus}% de gains)</span>
              </div>
            </div>
            <Users className="h-5 w-5 text-white/70" />
          </div>
        ) : (
          <div className="mt-4 bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border border-white/5 flex justify-between items-center opacity-80">
            <div>
              <div className="text-xs text-white/70 mb-1">Filleuls actifs</div>
              <div className="font-medium text-white/80">Aucun filleul</div>
            </div>
            <Users className="h-5 w-5 text-white/50" />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBalanceCard;
