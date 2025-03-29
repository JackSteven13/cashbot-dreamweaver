
import React from 'react';
import { PlanType } from '@/hooks/payment/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  PlanCardBadges,
  PlanCardHeader,
  PlanCardMetrics,
  PlanCardFeatures
} from './card';

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
  const isMobile = useIsMobile();
  
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
      style={{ 
        maxHeight: isMobile ? '400px' : '100%', 
        zIndex: 30,
        width: '100%'
      }}
    >
      <PlanCardBadges 
        mostPopular={mostPopular} 
        isCurrent={isCurrent} 
        current={current} 
        isSelected={isSelected} 
      />
      
      <div className="p-3 md:p-5 overflow-auto">
        <PlanCardHeader 
          title={title}
          price={price}
          description={description}
          subscriptionLabel={subscriptionLabel}
          subscriptionPrice={subscriptionPrice}
        />
        
        <PlanCardMetrics revenue={revenue} profit={profit} />
        
        <PlanCardFeatures 
          limit={limit}
          features={features}
          isHomePage={isHomePage}
          isMobile={isMobile}
          isSelected={isSelected}
        />
        
        {action && (
          <div className="pb-1">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;
