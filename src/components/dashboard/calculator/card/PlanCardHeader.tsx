
import React from 'react';
import { cn } from '@/lib/utils';

interface PlanCardHeaderProps {
  title: string;
  price: number;
  description: string;
  subscriptionLabel?: string;
  subscriptionPrice?: number;
}

const PlanCardHeader: React.FC<PlanCardHeaderProps> = ({
  title,
  price,
  description,
  subscriptionLabel = "/an", // Par défaut, on affiche /an au lieu de /mois
  subscriptionPrice
}) => {
  // Determine if we're showing just a regular price or a subscription price with label
  const showSubscriptionDetails = subscriptionPrice !== undefined;
  
  return (
    <div className="mb-3 md:mb-5">
      <h3 className="text-base md:text-lg font-bold tracking-tight mb-1 text-gray-900 dark:text-gray-50">
        {title}
      </h3>
      
      <div className="flex items-end mb-1 md:mb-2">
        <span className={cn(
          "font-bold tracking-tight",
          showSubscriptionDetails ? "text-lg md:text-xl" : "text-xl md:text-2xl"
        )}>
          {price}€
        </span>
        {!showSubscriptionDetails && (
          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 ml-1">
            {subscriptionLabel}
          </span>
        )}
      </div>
      
      {showSubscriptionDetails && (
        <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span className="font-medium">{subscriptionPrice}€{subscriptionLabel}</span>
        </div>  
      )}
      
      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
};

export default PlanCardHeader;
