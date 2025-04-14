
import React from 'react';

interface BotStatusIndicatorProps {
  active: boolean;
}

const BotStatusIndicator: React.FC<BotStatusIndicatorProps> = ({ active }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
      <span className={`text-sm font-medium ${active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {active ? 'Actif' : 'Inactif'}
      </span>
    </div>
  );
};

export default BotStatusIndicator;
