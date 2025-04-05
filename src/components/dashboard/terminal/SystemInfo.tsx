
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';

interface SystemInfoProps {
  isNewUser: boolean;
  onFeedbackClick?: () => void;
}

export const SystemInfo: React.FC<SystemInfoProps> = ({
  isNewUser,
  onFeedbackClick
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-lg">System Status</h3>
      {!isNewUser && (
        <button
          onClick={onFeedbackClick}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Send Feedback
        </button>
      )}
    </div>
  );
};

interface SystemInfoGridProps {
  subscription: string;
  tempProEnabled?: boolean;
  dailyLimit: number;
  remainingSessions: number | string;
  referralBonus?: number;
  botActive?: boolean;
}

export const SystemInfoGrid: React.FC<SystemInfoGridProps> = ({
  subscription,
  tempProEnabled,
  dailyLimit,
  remainingSessions,
  referralBonus = 0,
  botActive = true
}) => {
  // Format subscription display
  const formatSubscription = () => {
    let subName = subscription.charAt(0).toUpperCase() + subscription.slice(1);
    
    if (tempProEnabled && subscription === 'freemium') {
      return (
        <span>
          {subName} <Badge variant="outline" className="ml-1 bg-blue-900/30 text-blue-400 border-blue-700">Pro Trial</Badge>
        </span>
      );
    }
    
    return subName;
  };
  
  return (
    <div className="grid grid-cols-2 gap-3 mt-4 mb-5 text-xs">
      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
        <div className="text-gray-400 mb-1">Abonnement</div>
        <div className="font-medium text-white flex items-center">
          {formatSubscription()}
        </div>
      </div>
      
      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
        <div className="text-gray-400 mb-1">Limite journalière</div>
        <div className="font-medium text-white">{dailyLimit.toFixed(2)}€ / jour</div>
      </div>
      
      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
        <div className="text-gray-400 mb-1">Sessions restantes</div>
        <div className="font-medium text-white">
          {subscription === 'freemium' ? remainingSessions : '∞'}
        </div>
      </div>
      
      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
        <div className="text-gray-400 mb-1">Statut du bot</div>
        <div className="font-medium flex items-center">
          <span className={`inline-flex h-2 w-2 mr-2 rounded-full ${botActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className={`${botActive ? 'text-green-400' : 'text-red-400'}`}>
            {botActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>
    </div>
  );
};
