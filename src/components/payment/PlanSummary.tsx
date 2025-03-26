
import React from 'react';
import { PlanType, PLAN_PRICES } from '@/hooks/payment/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlanSummaryProps {
  selectedPlan: PlanType | null;
}

const PlanSummary = ({ selectedPlan }: PlanSummaryProps) => {
  const isMobile = useIsMobile();
  
  if (!selectedPlan) return null;
  
  return (
    <div className="bg-blue-50 p-3 md:p-4 rounded-md mb-3 md:mb-6 border border-blue-100">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium text-sm md:text-base text-[#1e3a5f]">
            {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
          </p>
          <p className="text-xs md:text-sm text-[#486581]">
            Abonnement mensuel
          </p>
        </div>
        <p className="text-base md:text-lg font-bold text-[#2d5f8a]">
          {PLAN_PRICES[selectedPlan]}€/mois
        </p>
      </div>
      
      {selectedPlan === 'freemium' && (
        <p className="mt-2 md:mt-3 text-green-600 text-xs md:text-sm font-medium">
          Cet abonnement est gratuit et ne nécessite pas de paiement.
        </p>
      )}
    </div>
  );
};

export default PlanSummary;
