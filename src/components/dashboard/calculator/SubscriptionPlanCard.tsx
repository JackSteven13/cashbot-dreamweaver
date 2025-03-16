
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
  // Determine background color based on current state
  const bgColorClass = isHomePage 
    ? isSelected ? 'bg-blue-900/40 border-blue-500' : 'bg-blue-950/40 border-blue-800/50' 
    : isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200';
  
  // Determine text colors based on page context
  const titleClass = isHomePage 
    ? (isCurrent ? 'text-blue-300' : 'text-white') 
    : (isCurrent ? 'text-blue-700' : 'text-gray-800');
  
  const smallTextClass = isHomePage ? 'text-blue-300' : 'text-gray-500';
  const revenueClass = isHomePage ? 'text-green-400' : 'text-green-600';
  const profitClass = profit > 0 
    ? (isHomePage ? 'text-green-400' : 'text-green-600') 
    : 'text-red-500';

  return (
    <div 
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${bgColorClass}`}
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
