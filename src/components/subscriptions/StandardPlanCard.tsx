
import React from 'react';
import SubscriptionPlanCard from '@/components/dashboard/calculator/SubscriptionPlanCard';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/payment/types';
import { PercentIcon } from 'lucide-react';

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
  commission,
  mostPopular,
  current,
  disabled,
  selectedPlan,
  onSelectPlan
}) => {
  // Formater la commission pour l'affichage
  const commissionPercent = Math.round(commission * 100);

  return (
    <div className="flex flex-col h-full">
      <SubscriptionPlanCard
        key={id}
        title={title}
        price={price}
        description={description}
        features={features}
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
      
      {/* Badge de commission de parrainage */}
      <div className="mt-2 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium py-1 px-2 rounded-full border border-amber-200 dark:border-amber-800">
        <PercentIcon className="h-3 w-3 mr-1.5" />
        <span>Commission de parrainage: <strong>{commissionPercent}%</strong></span>
      </div>
    </div>
  );
};

export default StandardPlanCard;
