
import React from 'react';

interface BalanceHeaderProps {
  dailyLimit: number;
}

const BalanceHeader: React.FC<BalanceHeaderProps> = ({ dailyLimit }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-white/90">Solde Disponible</h3>
      <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
        Max {dailyLimit}€/jour
      </div>
    </div>
  );
};

export default BalanceHeader;
