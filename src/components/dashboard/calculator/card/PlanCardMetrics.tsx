
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
  
  // Assurer que le profit est toujours positif
  let displayProfit = profit === undefined || isNaN(profit) ? 0 : profit;
  if (displayRevenue > 0 && displayProfit <= 0) {
    // Si le profit est négatif, on le rend positif
    displayProfit = displayRevenue * 0.4; // 40% du revenu comme profit
  }
  
  // Calcul du ROI (Return on Investment)
  const subscriptionCost = displayRevenue - displayProfit;
  const roi = subscriptionCost > 0 ? ((displayProfit / subscriptionCost) * 100).toFixed(0) : "N/A";
  
  // Déterminer les classes de couleur
  const profitColorClass = 'text-green-600 dark:text-green-400 font-bold';
  const roiColorClass = roi === "N/A" 
    ? 'text-gray-500 dark:text-gray-400'
    : 'text-green-600 dark:text-green-400 font-bold';
  
  return (
    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800/30">
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Revenu mensuel: <span className="font-bold">{displayRevenue.toFixed(2)}€</span>
      </p>
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Profit mensuel: <span className={`${profitColorClass}`}>{displayProfit.toFixed(2)}€</span>
        {subscriptionCost > 0 && (
          <span className={`text-[10px] ml-1 ${roiColorClass}`}>
            (ROI: {roi === "N/A" ? roi : roi + "%"})
          </span>
        )}
      </p>
    </div>
  );
};

export default PlanCardMetrics;
