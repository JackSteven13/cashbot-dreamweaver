
import React from 'react';
import SubscriptionPlanCard from '@/components/dashboard/calculator/SubscriptionPlanCard';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/payment/types';
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';

interface FeaturedPlanCardProps {
  currentSubscription: string;
  onSelectPlan: (planId: PlanType) => void;
}

const FeaturedPlanCard: React.FC<FeaturedPlanCardProps> = ({ 
  currentSubscription, 
  onSelectPlan 
}) => {
  const isCurrentPlan = currentSubscription === 'elite';
  
  return (
    <div className="w-full max-w-4xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-6 rounded-xl border border-purple-200 dark:border-purple-800 shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">Plan Recommandé</h2>
        <p className="text-gray-600 dark:text-gray-300">Le meilleur choix pour maximiser vos revenus</p>
      </div>
      
      <div className="w-full">
        <SubscriptionPlanCard
          key="elite"
          title="Elite"
          price={549}
          description="Pour les professionnels et entreprises"
          features={[
            'Limite de gains de 50€ par jour',
            'Accès illimité à toutes les fonctionnalités',
            'Commission de parrainage de 100%',
            '30% de commission récurrente',
            '10% de commission niveau 2',
            'Seuil de retrait de 1000€',
            'Support dédié 24/7',
            'Fonctionnalités exclusives en avant-première'
          ]}
          limit={SUBSCRIPTION_LIMITS['elite']}
          current={isCurrentPlan}
          isSelected={!isCurrentPlan}
          action={
            <Button
              variant={isCurrentPlan ? "secondary" : "primary"}
              className={`w-full ${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
              disabled={isCurrentPlan}
              onClick={() => onSelectPlan('elite')}
            >
              {isCurrentPlan ? 'Abonnement actuel' : 'Sélectionner Elite'}
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default FeaturedPlanCard;
