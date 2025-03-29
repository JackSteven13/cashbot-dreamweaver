
import React from 'react';

interface PlanCardMetricsProps {
  revenue?: number;
  profit?: number;
}

const PlanCardMetrics: React.FC<PlanCardMetricsProps> = ({ revenue, profit }) => {
  if (revenue === undefined || profit === undefined) {
    return null;
  }
  
  return (
    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Revenu: <span className="font-bold">{revenue.toFixed(2)}€</span>
      </p>
      <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-300">
        Profit: <span className="font-bold">{profit.toFixed(2)}€</span>
      </p>
    </div>
  );
};

export default PlanCardMetrics;
