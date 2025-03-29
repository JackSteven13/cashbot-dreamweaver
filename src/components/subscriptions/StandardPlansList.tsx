
import React from 'react';
import StandardPlanCard from './StandardPlanCard';
import { PlanType } from '@/hooks/payment/types';
import { Plan } from './types';

interface StandardPlansListProps {
  plans: Plan[];
  selectedPlan: PlanType;
  onSelectPlan: (planId: PlanType) => void;
}

const StandardPlansList: React.FC<StandardPlansListProps> = ({ 
  plans, 
  selectedPlan, 
  onSelectPlan 
}) => {
  // Filter out the Elite plan as it's featured separately
  const standardPlans = plans.filter(plan => plan.id !== 'elite');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
      {standardPlans.map((plan) => (
        <StandardPlanCard
          key={plan.id}
          id={plan.id}
          title={plan.title}
          price={plan.price}
          description={plan.description}
          features={plan.features}
          limit={plan.limit}
          commission={plan.commission}
          current={plan.current}
          mostPopular={plan.mostPopular}
          disabled={plan.disabled}
          selectedPlan={selectedPlan}
          onSelectPlan={onSelectPlan}
        />
      ))}
    </div>
  );
};

export default StandardPlansList;
