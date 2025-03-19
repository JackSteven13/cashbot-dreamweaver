
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SystemInfoProps {
  isNewUser: boolean;
  onFeedbackClick: () => void;
}

export const SystemInfo: React.FC<SystemInfoProps> = ({ isNewUser, onFeedbackClick }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <div className="flex space-x-1 mr-2">
          <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <div className="h-2.5 w-2.5 bg-blue-400 rounded-full"></div>
          <div className="h-2.5 w-2.5 bg-indigo-400 rounded-full"></div>
        </div>
        <h3 className="text-lg font-bold text-white">
          {isNewUser ? "CashBot • Bienvenue" : "CashBot • Système actif"}
        </h3>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs text-blue-200 hover:text-white hover:bg-blue-800/50"
        onClick={onFeedbackClick}
      >
        <AlertCircle className="h-3.5 w-3.5 mr-1" />
        Feedback
      </Button>
    </div>
  );
};

interface SystemInfoGridProps {
  subscription: string;
  tempProEnabled: boolean;
  dailyLimit: number;
  remainingSessions: number | string;
  referralBonus?: number;
}

export const SystemInfoGrid: React.FC<SystemInfoGridProps> = ({
  subscription,
  tempProEnabled,
  dailyLimit,
  remainingSessions,
  referralBonus = 0
}) => {
  return (
    <div className="space-y-3 mb-4 font-mono text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-effect p-3 rounded-lg">
          <div className="text-xs text-blue-200">Abonnement</div>
          <div className="text-sm font-medium text-white capitalize">
            {tempProEnabled ? 'Pro (Essai)' : subscription}
          </div>
        </div>
        <div className="glass-effect p-3 rounded-lg">
          <div className="text-xs text-blue-200">Limite journalière</div>
          <div className="text-sm font-medium text-white">
            {tempProEnabled ? '5€' : `${dailyLimit}€`}
          </div>
        </div>
        <div className="glass-effect p-3 rounded-lg">
          <div className="text-xs text-blue-200">Sessions</div>
          <div className="text-sm font-medium text-white">
            {tempProEnabled 
              ? 'Illimitées (Essai)' 
              : (subscription === 'freemium' 
                ? `${remainingSessions} session${remainingSessions !== 1 ? 's' : ''} restante${remainingSessions !== 1 ? 's' : ''}` 
                : 'Illimitées')}
          </div>
        </div>
        <div className="glass-effect p-3 rounded-lg">
          <div className="text-xs text-blue-200">Bonus parrainage</div>
          <div className="text-sm font-medium text-white">
            {referralBonus > 0 ? `+${referralBonus}%` : '0%'}
          </div>
        </div>
      </div>
    </div>
  );
};
