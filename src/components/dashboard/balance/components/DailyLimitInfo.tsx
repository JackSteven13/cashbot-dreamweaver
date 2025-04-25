
import React, { useState, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface DailyLimitInfoProps {
  subscription: string;
  isAnimating?: boolean;
}

export const DailyLimitInfo: React.FC<DailyLimitInfoProps> = ({ 
  subscription = 'freemium',
  isAnimating = false 
}) => {
  const [showLimit, setShowLimit] = useState(subscription === 'freemium');
  
  useEffect(() => {
    setShowLimit(subscription === 'freemium');
  }, [subscription]);
  
  // Si ce n'est pas un utilisateur freemium, ne pas afficher la limite
  if (!showLimit) return null;
  
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription]?.dailyEarningCap || 0.50;
  
  return (
    <div className={`text-xs font-medium mt-0.5 transition-opacity ${
      isAnimating ? 'text-blue-300' : 'text-blue-500/70 dark:text-blue-400/70'
    }`}>
      Limite : {dailyLimit.toFixed(2)}€/jour
    </div>
  );
};
