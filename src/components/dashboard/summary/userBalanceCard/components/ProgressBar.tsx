
import React from 'react';
import { Award } from 'lucide-react';

interface ProgressBarProps {
  displayBalance: number;
  withdrawalThreshold: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ displayBalance, withdrawalThreshold }) => {
  const progressPercentage = Math.min(Math.floor((displayBalance / withdrawalThreshold) * 100), 95);
  const isNearThreshold = progressPercentage >= 80;
  const isAtMaximum = progressPercentage >= 95;

  return (
    <div className="mt-3 mb-1">
      <div className="w-full bg-slate-700/70 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${progressPercentage >= 95 ? 'bg-yellow-500' : progressPercentage >= 80 ? 'bg-amber-500' : 'bg-[#9b87f5]'} transition-all duration-1000`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-white/60 mt-1">
        <span>{progressPercentage}%</span>
        <span>
          {progressPercentage >= 95 ? (
            <span className="text-yellow-300 flex items-center">
              <Award className="h-3 w-3 mr-1" />
              Quelques euros restants!
            </span>
          ) : (
            `Seuil: ${withdrawalThreshold}€`
          )}
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
