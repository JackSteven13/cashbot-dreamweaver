
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CrownIcon, Users } from 'lucide-react';

interface SubscriptionLevelDisplayProps {
  subscription: string;
  referralCount?: number;
  limitPercentage: number;
  dailyLimit: number;
}

const SubscriptionLevelDisplay: React.FC<SubscriptionLevelDisplayProps> = ({
  subscription,
  referralCount = 0,
  limitPercentage,
  dailyLimit
}) => {
  const getSubscriptionLabel = () => {
    switch (subscription) {
      case 'pro':
        return 'Pro';
      case 'elite':
        return 'Elite';
      case 'premium':
        return 'Premium';
      default:
        return 'Freemium';
    }
  };

  const getSubscriptionColor = () => {
    switch (subscription) {
      case 'pro':
        return 'text-blue-400 bg-blue-950/50 border-blue-800/30';
      case 'elite':
        return 'text-purple-400 bg-purple-950/50 border-purple-800/30';
      case 'premium':
        return 'text-amber-400 bg-amber-950/50 border-amber-800/30';
      default:
        return 'text-slate-300 bg-slate-800/50 border-slate-700/30';
    }
  };

  const getProgressColor = () => {
    if (limitPercentage >= 90) return 'bg-red-500';
    if (limitPercentage >= 75) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CrownIcon size={16} className={subscription !== 'freemium' ? 'text-amber-400' : 'text-slate-400'} />
          <span className="text-sm font-medium text-slate-200">Abonnement</span>
        </div>
        <Badge variant="outline" className={`${getSubscriptionColor()} px-2 py-0.5 text-xs`}>
          {getSubscriptionLabel()}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Limite journalière: {dailyLimit.toFixed(2)}€</span>
          <span className={limitPercentage >= 90 ? 'text-red-400' : limitPercentage >= 75 ? 'text-amber-400' : 'text-slate-400'}>
            {limitPercentage.toFixed(0)}%
          </span>
        </div>
        <Progress value={limitPercentage} max={100} className="h-1.5 bg-slate-700/50">
          <div className={`h-full ${getProgressColor()}`} style={{ width: `${limitPercentage}%` }} />
        </Progress>
      </div>
      
      {referralCount > 0 && (
        <div className="flex items-center gap-1.5 mt-1">
          <Users size={14} className="text-blue-400" />
          <span className="text-xs text-slate-400">{referralCount} filleul{referralCount !== 1 ? 's' : ''} actif{referralCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};

export default SubscriptionLevelDisplay;
