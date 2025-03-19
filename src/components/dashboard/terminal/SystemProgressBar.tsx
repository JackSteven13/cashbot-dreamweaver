
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface SystemProgressBarProps {
  displayBalance: number;
  dailyLimit: number;
  limitPercentage: number;
}

export const SystemProgressBar: React.FC<SystemProgressBarProps> = ({ 
  displayBalance, 
  dailyLimit, 
  limitPercentage 
}) => {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium text-blue-100">
          Progression de la limite journalière
        </div>
        <div className="text-sm font-bold text-blue-100">
          {displayBalance.toFixed(2)}€ / {dailyLimit.toFixed(1)}€
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-blue-800/50 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${limitPercentage}%` }}
        />
      </div>
    </div>
  );
};
