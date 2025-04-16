
import React from 'react';
import SubscriptionPlanCard from '@/components/dashboard/calculator/SubscriptionPlanCard';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/payment/types';

interface PlanProps {
  id: PlanType;
  title: string;
  price: number;
  description: string;
  features: string[];
  limit: number;
  commission: number;
  mostPopular?: boolean;
  current?: boolean;
  disabled?: boolean;
  selectedPlan: PlanType;
  onSelectPlan: (planId: PlanType) => void;
}

const StandardPlanCard: React.FC<PlanProps> = ({
  id,
  title,
  price,
  description,
  features,
  limit,
  mostPopular,
  current,
  disabled,
  selectedPlan,
  onSelectPlan
}) => {
  // Remove the redundant daily limit feature
  const filteredFeatures = features.filter(feature => 
    !feature.toLowerCase().includes('limite de gains') && 
    !feature.toLowerCase().includes('limite quotidienne')
  );

  return (
    <SubscriptionPlanCard
      key={id}
      title={title}
      price={price}
      description={description}
      features={filteredFeatures}
      limit={limit}
      current={current}
      mostPopular={mostPopular}
      isSelected={selectedPlan === id && !current}
      subscriptionLabel="/an"
      action={
        <Button
          variant={current ? "secondary" : "primary"}
          className={`w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          onClick={() => onSelectPlan(id)}
        >
          {current ? 'Abonnement actuel' : `Sélectionner ${title}`}
        </Button>
      }
    />
  );
};

export default StandardPlanCard;
