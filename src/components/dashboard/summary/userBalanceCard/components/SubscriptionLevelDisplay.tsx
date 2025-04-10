
import React from 'react';
import { Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface SubscriptionLevelDisplayProps {
  subscription: string;
  referralCount?: number;
  limitPercentage: number;
  dailyLimit: number;
  isNewUser?: boolean;
}

const SubscriptionLevelDisplay: React.FC<SubscriptionLevelDisplayProps> = ({
  subscription,
  referralCount = 0,
  limitPercentage,
  dailyLimit,
  isNewUser = false
}) => {
  // Arrondissement du pourcentage pour l'affichage
  const displayPercentage = Math.round(limitPercentage);
  
  // Déterminer la couleur de la barre de progression en fonction du pourcentage
  const getProgressColor = () => {
    if (displayPercentage >= 100) return 'bg-red-500';
    if (displayPercentage > 90) return 'bg-orange-500';
    if (displayPercentage > 75) return 'bg-amber-500';
    return 'bg-green-500';
  };
  
  // Déterminer le message d'état limite à afficher
  const getLimitStatusText = () => {
    if (displayPercentage >= 100) return 'Limite atteinte';
    if (displayPercentage > 90) return 'Presque atteinte';
    if (displayPercentage > 75) return 'En progression';
    return 'Disponible';
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300 capitalize">
            {subscription}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Limite: {dailyLimit}€/jour
        </span>
      </div>
      
      <div className="relative">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Limite quotidienne</span>
          <span className={`${
            displayPercentage >= 100 ? 'text-red-400' : 
            displayPercentage > 90 ? 'text-orange-400' : 
            'text-slate-300'
          }`}>
            {displayPercentage}% - {getLimitStatusText()}
          </span>
        </div>
        
        <Progress value={displayPercentage} className="h-2 bg-slate-700">
          <div 
            className={`h-full rounded-full ${getProgressColor()}`} 
            style={{ width: `${Math.min(100, displayPercentage)}%` }}
          />
        </Progress>
      </div>
    </div>
  );
};

export default SubscriptionLevelDisplay;
