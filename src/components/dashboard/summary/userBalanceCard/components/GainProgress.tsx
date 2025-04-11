
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface GainProgressProps {
  currentGain: number;
  subscription: string;
  animate?: boolean;
}

const GainProgress: React.FC<GainProgressProps> = ({ 
  currentGain = 0, 
  subscription = 'freemium',
  animate = false 
}) => {
  // Déterminer la limite en fonction de l'abonnement
  const limit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculer le pourcentage de progression (max 100%)
  const percentage = Math.min(100, (currentGain / limit) * 100);
  
  // Déterminer la couleur en fonction du pourcentage
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-600 dark:text-gray-400">Gains quotidiens</span>
        <span className="font-medium">
          {currentGain.toFixed(2)}€ / {limit.toFixed(2)}€
        </span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2 bg-gray-200 dark:bg-gray-700"
        indicatorClassName={`${getProgressColor()} ${animate ? 'transition-all duration-500' : ''}`}
      />
    </div>
  );
};

export default GainProgress;
