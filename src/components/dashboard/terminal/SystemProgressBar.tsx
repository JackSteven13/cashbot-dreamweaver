
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
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs font-medium text-gray-300">
          Progression de la limite journalière
        </div>
        <div className="text-xs font-medium text-gray-300">
          {displayBalance.toFixed(2)}€ / {dailyLimit}€
        </div>
      </div>
      <Progress value={limitPercentage} className="h-2 bg-slate-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
          style={{ width: `${limitPercentage}%` }}
        />
      </Progress>
    </div>
  );
};
