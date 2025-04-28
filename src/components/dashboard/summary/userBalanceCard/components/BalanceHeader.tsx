
import React from 'react';

interface BalanceHeaderProps {
  dailyLimit: number;
}

const BalanceHeader: React.FC<BalanceHeaderProps> = ({ dailyLimit }) => {
  return (
    <div className="flex items-center justify-end mb-4">
      <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
        Max {dailyLimit}€/jour
      </div>
    </div>
  );
};

export default BalanceHeader;
