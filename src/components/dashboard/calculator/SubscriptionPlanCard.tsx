
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SUBSCRIPTION_DESCRIPTIONS } from './constants';
import {
  PlanCardBadges,
  PlanCardHeader,
  PlanCardMetrics,
  PlanCardFeatures
} from './card';
import PlanCardContainer from './components/PlanCardContainer';
import { SubscriptionPlanCardProps } from './types';

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  title,
  price,
  description,
  features,
  limit,
  current = false,
  mostPopular = false,
  action,
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
  const effectiveDescription = description || SUBSCRIPTION_DESCRIPTIONS[title.toLowerCase()] || '';
  const paddingClass = isMobile ? "p-2 md:p-5" : "p-3 md:p-5";
  
  return (
    <PlanCardContainer
      isSelected={isSelected}
      mostPopular={mostPopular}
      isCurrent={isCurrent}
      current={current}
      onClick={onClick}
    >
      <PlanCardBadges 
        mostPopular={mostPopular} 
        isCurrent={isCurrent} 
        current={current} 
        isSelected={isSelected} 
      />
      
      <div className={`${paddingClass} overflow-auto`}>
        <PlanCardHeader 
          title={title}
          price={price}
          description={effectiveDescription}
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
    </PlanCardContainer>
  );
};

export default SubscriptionPlanCard;
