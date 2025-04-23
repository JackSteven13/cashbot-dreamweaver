
import React from 'react';
import { Coins } from 'lucide-react';

const BalanceHeader = () => {
  return (
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">
        Votre solde
      </h2>
      <Coins className="h-5 w-5 text-blue-600" />
    </div>
  );
};

export default BalanceHeader;
