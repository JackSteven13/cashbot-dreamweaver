
import React from 'react';
import { WITHDRAWAL_THRESHOLDS } from '@/utils/referral/withdrawalUtils';

interface PlanCardMetricsProps {
  revenue?: number;
  profit?: number;
  plan?: string;
}

const PlanCardMetrics: React.FC<PlanCardMetricsProps> = ({ 
  revenue, 
  profit,
  plan = 'freemium'
}) => {
  // Ne pas afficher le composant si les deux valeurs sont undefined
  if (revenue === undefined && profit === undefined) {
    return null;
  }
  
  // Valeurs par défaut pour éviter NaN
  const displayRevenue = revenue === undefined || isNaN(revenue) ? 0 : revenue;
  const displayProfit = profit === undefined || isNaN(profit) ? 0 : profit;
  
  // Utiliser une couleur plus neutre et professionnelle pour les profits
  const profitColorClass = 'text-blue-400 dark:text-blue-400 font-bold';
  
  // Calculer le nombre de mois nécessaires pour atteindre le seuil de retrait
  const withdrawalThreshold = WITHDRAWAL_THRESHOLDS[plan as keyof typeof WITHDRAWAL_THRESHOLDS] || 300;
  const monthsToWithdrawal = displayRevenue > 0 
    ? Math.ceil(withdrawalThreshold / displayRevenue)
    : 0;
  
  return (
    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800/30">
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Revenu mensuel: <span className="font-bold">{displayRevenue.toFixed(2)}€</span>
      </p>
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Profit mensuel: <span className={`${profitColorClass}`}>{displayProfit.toFixed(2)}€</span>
      </p>
      {monthsToWithdrawal > 0 && (
        <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
          Environ {monthsToWithdrawal} mois pour atteindre le seuil de retrait
        </p>
      )}
    </div>
  );
};

export default PlanCardMetrics;
