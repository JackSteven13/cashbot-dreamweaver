
import React from 'react';
import { Coins } from 'lucide-react';

const BalanceHeader: React.FC = () => {
  return (
    <div className="flex items-center mb-2">
      <Coins className="h-5 w-5 mr-1 text-blue-600 dark:text-blue-400" />
      <h4 className="text-lg font-medium text-blue-800 dark:text-blue-300">
        Votre solde
      </h4>
    </div>
  );
};

export default BalanceHeader;
