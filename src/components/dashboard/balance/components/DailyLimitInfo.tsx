
import React from 'react';
import { TrendingUp } from 'lucide-react';

interface DailyLimitInfoProps {
  subscription: string;
  isAnimating: boolean;
}

export const DailyLimitInfo: React.FC<DailyLimitInfoProps> = ({
  subscription,
  isAnimating
}) => {
  return (
    <div className={`text-xs flex items-center mt-1 ${isAnimating ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`}>
      <TrendingUp className="h-3 w-3 mr-1" />
      <span>{subscription === 'freemium' ? 'Limite: 0,50€/jour' : 'Robot actif'}</span>
    </div>
  );
};
