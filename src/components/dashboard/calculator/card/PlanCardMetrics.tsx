
import React from 'react';

interface PlanCardMetricsProps {
  revenue?: number;
  profit?: number;
}

const PlanCardMetrics: React.FC<PlanCardMetricsProps> = ({ revenue, profit }) => {
  // Ne pas afficher le composant si les deux valeurs sont undefined
  if (revenue === undefined && profit === undefined) {
    return null;
  }
  
  // Valeurs par défaut pour éviter NaN
  const displayRevenue = revenue === undefined || isNaN(revenue) ? 0 : revenue;
  const displayProfit = profit === undefined || isNaN(profit) ? 0 : profit;
  
  return (
    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Revenu: <span className="font-bold">{displayRevenue.toFixed(2)}€*</span>
      </p>
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Profit: <span className="font-bold">{displayProfit.toFixed(2)}€*</span>
      </p>
      <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 italic">
        *Gains estimatifs, non garantis
      </p>
    </div>
  );
};

export default PlanCardMetrics;
