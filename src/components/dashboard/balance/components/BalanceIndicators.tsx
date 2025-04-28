
import React from 'react';
import { Coins } from 'lucide-react';

interface BalanceIndicatorsProps {
  isAnimating: boolean;
  subscription: string;
}

export const BalanceIndicators: React.FC<BalanceIndicatorsProps> = ({
  isAnimating,
  subscription
}) => {
  return (
    <div className="flex items-center">
      <div className={`${isAnimating ? 'bg-blue-700 dark:bg-blue-600' : 'bg-blue-100 dark:bg-blue-900'} p-3 rounded-lg mr-4 transition-colors duration-300`}>
        <Coins className={`h-8 w-8 ${isAnimating ? 'text-yellow-300 animate-bounce' : 'text-blue-600 dark:text-blue-400'}`} />
      </div>
      <div className="relative w-full">
        {subscription !== 'freemium' && (
          <span className="ml-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
            {subscription.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
};
