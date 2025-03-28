
import React from 'react';
import { AlertCircle, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SystemInfoProps {
  isNewUser: boolean;
  onFeedbackClick: () => void;
}

export const SystemInfo: React.FC<SystemInfoProps> = ({ isNewUser, onFeedbackClick }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <div className="h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        <h3 className="text-lg font-medium text-white">
          {isNewUser ? "Stream genius • Bienvenue" : "Stream genius • Système actif"}
        </h3>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs text-gray-300 hover:text-white hover:bg-slate-700/50"
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
  const isAlphaPlan = subscription === 'alpha';
  
  return (
    <div className="space-y-3 mb-4 font-mono text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className={`${isAlphaPlan ? 'bg-violet-800/40' : 'bg-slate-700/30'} p-2 rounded-lg border ${isAlphaPlan ? 'border-purple-500/30' : 'border-slate-600/50'}`}>
          <div className="text-xs text-gray-400">Abonnement</div>
          <div className="text-sm font-medium text-white capitalize flex items-center">
            {tempProEnabled ? 'Pro (Essai)' : subscription}
            {isAlphaPlan && <Sparkles className="h-3 w-3 text-purple-300 ml-1" />}
          </div>
        </div>
        <div className={`${isAlphaPlan ? 'bg-violet-800/40' : 'bg-slate-700/30'} p-2 rounded-lg border ${isAlphaPlan ? 'border-purple-500/30' : 'border-slate-600/50'}`}>
          <div className="text-xs text-gray-400">Limite journalière</div>
          <div className="text-sm font-medium text-white">
            {tempProEnabled ? '5€' : `${dailyLimit}€`}
          </div>
        </div>
        <div className={`${isAlphaPlan ? 'bg-violet-800/40' : 'bg-slate-700/30'} p-2 rounded-lg border ${isAlphaPlan ? 'border-purple-500/30' : 'border-slate-600/50'}`}>
          <div className="text-xs text-gray-400">Sessions</div>
          <div className="text-sm font-medium text-white">
            {tempProEnabled 
              ? 'Illimitées (Essai)' 
              : (subscription === 'freemium' 
                ? `${remainingSessions} session${remainingSessions !== 1 ? 's' : ''} restante${remainingSessions !== 1 ? 's' : ''}` 
                : 'Illimitées')}
          </div>
        </div>
        <div className={`${isAlphaPlan ? 'bg-violet-800/40' : 'bg-slate-700/30'} p-2 rounded-lg border ${isAlphaPlan ? 'border-purple-500/30' : 'border-slate-600/50'}`}>
          <div className="text-xs text-gray-400">Bonus parrainage</div>
          <div className="text-sm font-medium text-white flex items-center">
            {referralBonus > 0 ? (
              <>
                <span>+{referralBonus}%</span>
                <Users className="h-3 w-3 ml-1 text-green-300" />
              </>
            ) : (
              <span className="flex items-center">
                0% <span className="text-xs ml-1 text-gray-400">(aucun filleul)</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
