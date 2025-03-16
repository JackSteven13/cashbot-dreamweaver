
import React from 'react';

interface SubscriptionPlanCardProps {
  plan: string;
  isSelected: boolean;
  isHomePage: boolean;
  isCurrent: boolean;
  isFreemium: boolean;
  subscriptionLabel: string;
  subscriptionPrice: number;
  revenue: number;
  profit: number;
  onClick: () => void;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isSelected,
  isHomePage,
  isCurrent,
  isFreemium,
  subscriptionLabel,
  subscriptionPrice,
  revenue,
  profit,
  onClick
}) => {
  // Dark mode compatible background colors
  const bgColorClass = isHomePage 
    ? isSelected ? 'bg-blue-900/40 border-blue-500 dark:bg-blue-800/60 dark:border-blue-400' : 'bg-blue-950/40 border-blue-800/50 dark:bg-blue-900/50 dark:border-blue-700/50' 
    : isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800/50';
  
  // Dark mode compatible text colors
  const titleClass = isHomePage 
    ? (isCurrent ? 'text-blue-300 dark:text-blue-200' : 'text-white') 
    : (isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100');
  
  const smallTextClass = isHomePage 
    ? 'text-blue-300 dark:text-blue-200' 
    : 'text-gray-500 dark:text-gray-400';
  
  const revenueClass = isHomePage 
    ? 'text-green-400 dark:text-green-300' 
    : 'text-green-600 dark:text-green-400';
  
  const profitClass = profit > 0 
    ? (isHomePage ? 'text-green-400 dark:text-green-300' : 'text-green-600 dark:text-green-400') 
    : 'text-red-500 dark:text-red-400';

  return (
    <div 
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${bgColorClass} hover:shadow-md`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className={`font-medium ${titleClass}`}>
            {subscriptionLabel}
            {isFreemium && 
              <span className="ml-2 text-xs opacity-75">(Limité à 1 session/jour)</span>
            }
          </span>
          <div className={`text-xs ${smallTextClass} mt-1`}>
            {subscriptionPrice > 0 
              ? `${subscriptionPrice.toFixed(2)}€/mois` 
              : 'Gratuit'}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${revenueClass}`}>
            {revenue.toFixed(2)}€
          </div>
          <div className={`text-xs ${smallTextClass}`}>
            Profit: <span className={profitClass}>
              {profit.toFixed(2)}€
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;
