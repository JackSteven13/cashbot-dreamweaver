
import React from 'react';
import { PlanType, PLAN_PRICES } from '@/hooks/payment/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sparkles } from 'lucide-react';

interface PlanSummaryProps {
  selectedPlan: PlanType | null;
}

const PlanSummary = ({ selectedPlan }: PlanSummaryProps) => {
  const isMobile = useIsMobile();
  
  if (!selectedPlan) return null;
  
  const isAlphaPlan = selectedPlan === 'alpha';
  
  // Style spécial pour le plan Alpha
  if (isAlphaPlan) {
    return (
      <div className="bg-gradient-to-r from-violet-900/20 to-purple-800/20 p-3 md:p-4 rounded-md mb-3 md:mb-6 border border-purple-300/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDMwaC02bTMgM20tNiAwaC02bTEyIDBoLTYiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-70"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <div className="flex items-center">
              <p className="font-bold text-sm md:text-base text-purple-700 dark:text-purple-300">
                {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
              </p>
              <Sparkles className="h-3 w-3 text-purple-500 ml-1" />
            </div>
            <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400">
              Abonnement Premium
            </p>
          </div>
          <p className="text-base md:text-lg font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
            {PLAN_PRICES[selectedPlan]}€/mois
          </p>
        </div>
      </div>
    );
  }
  
  // Style standard pour les autres plans
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
