
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
    
    // Only calculate based on daily limit, not total balance
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // This should be based on today's gains, not total balance
    // For now we'll use the limit percentage passed in, but ideally we'd 
    // calculate this from today's transactions
    setCalculatedPercentage(Math.min(100, limitPercentage));
  }, [subscription, displayBalance, dailyLimit, limitPercentage]);

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs font-medium text-gray-300">
          Progression de la limite journalière
        </div>
        <div className="text-xs font-medium text-gray-300">
          {/* This should be today's gains, not total balance */}
          {limitPercentage.toFixed(0)}% / {effectiveLimit}€ par jour
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
