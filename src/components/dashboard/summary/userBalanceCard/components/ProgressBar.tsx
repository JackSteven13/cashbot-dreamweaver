
import React from 'react';

interface ProgressBarProps {
  displayBalance: number;
  withdrawalThreshold: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  displayBalance = 0,
  withdrawalThreshold = 200
}) => {
  // Ensure valid numbers and calculate progress
  const safeBalance = typeof displayBalance === 'number' ? displayBalance : 0;
  const safeThreshold = typeof withdrawalThreshold === 'number' ? withdrawalThreshold : 200;
  const progress = Math.min(100, (safeBalance / safeThreshold) * 100);
  
  return (
    <div className="mt-2 mb-4">
      <div className="flex justify-between text-xs mb-1">
        <span>Progression retrait</span>
        <span>{safeBalance.toFixed(2)}€ / {safeThreshold}€</span>
      </div>
      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
