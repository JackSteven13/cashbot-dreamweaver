
import React from 'react';
import { PlanType, PLAN_PRICES } from '@/hooks/payment/types';

interface PlanSummaryProps {
  selectedPlan: PlanType | null;
}

const PlanSummary = ({ selectedPlan }: PlanSummaryProps) => {
  if (!selectedPlan) return null;
  
  return (
    <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-100">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium text-[#1e3a5f]">
            {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
          </p>
          <p className="text-sm text-[#486581]">
            Abonnement mensuel
          </p>
        </div>
        <p className="text-lg font-bold text-[#2d5f8a]">
          {PLAN_PRICES[selectedPlan]}€/mois
        </p>
      </div>
    </div>
  );
};

export default PlanSummary;
