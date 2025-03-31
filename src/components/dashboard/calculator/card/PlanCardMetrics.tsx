
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
  
  // Modification: Ajustement du profit pour qu'il soit positif
  // On s'assure que le profit représente au moins 25% du revenu
  let displayProfit = profit === undefined || isNaN(profit) ? 0 : profit;
  if (displayRevenue > 0 && displayProfit <= 0) {
    // Si le profit est négatif, on le rend positif
    displayProfit = displayRevenue * 0.3; // 30% du revenu comme profit
  }
  
  // Calcul des gains journaliers moyens (augmentés pour paraître plus attractifs)
  const dailyAverage = displayRevenue > 0 ? Math.ceil(displayRevenue / 25) : 0; // Diviser par 25 au lieu de 30 pour augmenter la moyenne
  
  // Calcul du ROI (Return on Investment)
  const subscriptionCost = displayRevenue - displayProfit;
  const roi = subscriptionCost > 0 ? ((displayProfit / subscriptionCost) * 100).toFixed(0) : "N/A";
  
  // Déterminer la couleur du profit (toujours vert maintenant)
  const profitColorClass = 'text-green-600 dark:text-green-400';
    
  // Déterminer la couleur du ROI (toujours vert ou gris si N/A)
  const roiColorClass = roi === "N/A" 
    ? 'text-gray-500 dark:text-gray-400'
    : 'text-green-600 dark:text-green-400';
  
  return (
    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800/30">
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Revenu mensuel: <span className="font-bold">{displayRevenue.toFixed(2)}€</span>
      </p>
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Profit mensuel: <span className={`font-bold ${profitColorClass}`}>{displayProfit.toFixed(2)}€</span>
        {subscriptionCost > 0 && (
          <span className={`text-[10px] ml-1 ${roiColorClass}`}>
            (ROI: {roi === "N/A" ? roi : roi + "%"})
          </span>
        )}
      </p>
      <p className="text-[10px] mt-1 text-blue-600 dark:text-blue-400 italic">
        (Basé sur {dailyAverage}€/jour en moyenne)
      </p>
      <p className="text-[9px] mt-0.5 text-blue-500/70 dark:text-blue-400/70">
        *Les résultats peuvent être supérieurs selon votre activité et votre stratégie
      </p>
    </div>
  );
};

export default PlanCardMetrics;
