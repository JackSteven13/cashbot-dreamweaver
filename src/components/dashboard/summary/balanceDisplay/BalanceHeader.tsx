
import React from 'react';
import { Coins } from 'lucide-react';

export interface BalanceHeaderProps {
  className?: string;
}

const BalanceHeader: React.FC<BalanceHeaderProps> = ({ className }) => {
  return (
    <div className={`flex justify-between items-center mb-2 ${className || ''}`}>
      <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">
        Solde
      </h2>
      <Coins className="h-5 w-5 text-blue-600" />
    </div>
  );
};

export default BalanceHeader;
