
import React from 'react';
import { PlanType } from '@/hooks/payment/types';
import { cn } from '@/lib/utils';

interface SubscriptionPlanCardProps {
  title: string;
  price: number;
  description: string;
  features: string[];
  limit: number;
  current?: boolean;
  mostPopular?: boolean;
  action?: React.ReactNode;
  // Add new props needed for RevenueCalculator
  plan?: string;
  isSelected?: boolean;
  isHomePage?: boolean;
  isCurrent?: boolean;
  isFreemium?: boolean;
  subscriptionLabel?: string;
  subscriptionPrice?: number;
  revenue?: number;
  profit?: number;
  onClick?: () => void;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  title,
  price,
  description,
  features,
  limit,
  current = false,
  mostPopular = false,
  action,
  // Default values for new props
  isSelected = false,
  isHomePage = false,
  isCurrent = false,
  isFreemium = false,
  subscriptionLabel,
  subscriptionPrice,
  revenue,
  profit,
  onClick
}) => {
  // Determine the card color based on the props
  const cardBorderClass = isSelected 
    ? 'border-purple-500 ring-2 ring-purple-500/40 transform scale-[1.02] z-10'
    : mostPopular 
      ? 'border-blue-500 ring-2 ring-blue-500/40 transform scale-[1.02] z-10' 
      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700';
  
  const cardBgClass = isCurrent || current
    ? 'bg-blue-50 dark:bg-blue-900/30'
    : isSelected
      ? 'bg-purple-50/50 dark:bg-purple-900/20'
      : 'bg-white dark:bg-gray-800';

  return (
    <div 
      className={cn(
        "relative rounded-xl border-2 shadow-md overflow-hidden transition-all duration-200",
        cardBorderClass,
        cardBgClass,
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {mostPopular && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
          POPULAIRE
        </div>
      )}
      {(isCurrent || current) && (
        <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-br-lg">
          ACTUEL
        </div>
      )}
      {isSelected && !(isCurrent || current) && (
        <div className="absolute top-0 left-0 bg-purple-600 text-white px-3 py-1 text-xs font-semibold rounded-br-lg">
          SÉLECTIONNÉ
        </div>
      )}
      <div className="p-4 md:p-5">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
          {subscriptionLabel || title}
        </h3>
        <div className="mb-3">
          <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {subscriptionPrice || price}€
          </span>
          {(subscriptionPrice || price) > 0 && <span className="text-gray-500 dark:text-gray-400">/mois</span>}
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">{description}</p>
        
        {/* Display revenue and profit information if available */}
        {revenue !== undefined && profit !== undefined && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Revenu: <span className="font-bold">{revenue.toFixed(2)}€</span>
            </p>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Profit: <span className="font-bold">{profit.toFixed(2)}€</span>
            </p>
          </div>
        )}
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Limite quotidienne: <span className="font-semibold text-blue-600 dark:text-blue-400">{limit}€</span>
          </p>
          <ul className="space-y-1 mt-2">
            {features.slice(0, isHomePage ? 2 : features.length).map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg className={`h-4 w-4 ${isSelected ? 'text-purple-500' : 'text-green-500'} shrink-0 mr-2 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {action && (
          <div>
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;
