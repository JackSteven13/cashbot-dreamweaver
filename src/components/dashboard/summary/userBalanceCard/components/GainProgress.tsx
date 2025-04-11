
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface GainProgressProps {
  currentGain: number;
  subscription: string;
  animate?: boolean;
  // New props to support different APIs and backward compatibility
  currentValue?: number;
  maxValue?: number;
  showTooltip?: boolean;
  tooltipText?: string;
  className?: string;
}

const GainProgress: React.FC<GainProgressProps> = ({ 
  currentGain = 0, 
  subscription = 'freemium',
  animate = false,
  currentValue,
  maxValue,
  showTooltip = false,
  tooltipText,
  className = ''
}) => {
  // Déterminer la limite en fonction de l'abonnement
  const limit = maxValue !== undefined ? maxValue : 
    (SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5);
  
  // Use either currentValue or currentGain for backward compatibility
  const value = currentValue !== undefined ? currentValue : currentGain;
  
  // Calculer le pourcentage de progression (max 100%)
  const percentage = Math.min(100, (value / limit) * 100);
  
  // Déterminer la couleur en fonction du pourcentage
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`w-full space-y-1 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-600 dark:text-gray-400">Gains quotidiens</span>
        <span className="font-medium">
          {value.toFixed(2)}€ / {limit.toFixed(2)}€
        </span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2 bg-gray-200 dark:bg-gray-700"
        // Use style instead of indicatorClassName
        style={{ 
          ['--progress-background' as any]: getProgressColor().replace('bg-', '--'),
          transition: animate ? 'all 500ms' : 'none'
        }}
      />
      {showTooltip && tooltipText && (
        <div className="text-xs opacity-75 mt-1">{tooltipText}</div>
      )}
    </div>
  );
};

// Export both as default and named export for backward compatibility
export { GainProgress };
export default GainProgress;
