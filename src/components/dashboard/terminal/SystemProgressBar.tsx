
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';

interface SystemProgressBarProps {
  displayBalance: number;
  dailyLimit: number;
  limitPercentage: number;
  subscription: string;
}

export const SystemProgressBar: React.FC<SystemProgressBarProps> = ({ 
  displayBalance, 
  dailyLimit,
  limitPercentage,
  subscription
}) => {
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  const [calculatedPercentage, setCalculatedPercentage] = useState(limitPercentage);
  
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setEffectiveLimit(limit);
    setCalculatedPercentage(Math.min(100, (displayBalance / limit) * 100));
  }, [subscription, displayBalance, dailyLimit]);

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs font-medium text-gray-300">
          Progression de la limite journalière
        </div>
        <div className="text-xs font-medium text-gray-300">
          {displayBalance.toFixed(2)}€ / {effectiveLimit}€
        </div>
      </div>
      <Progress value={calculatedPercentage} className="h-2 bg-slate-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
          style={{ width: `${calculatedPercentage}%` }}
        />
      </Progress>
    </div>
  );
};
