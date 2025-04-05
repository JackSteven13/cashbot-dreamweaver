
import React from 'react';
import { Cpu, Signal, Bot, BotOff } from 'lucide-react';

interface SystemIndicatorsProps {
  showAnalysis?: boolean;
  botActive?: boolean;
}

export const SystemIndicators: React.FC<SystemIndicatorsProps> = ({ 
  showAnalysis = false,
  botActive = true
}) => {
  // Simulate varying CPU load
  const randomLoad = Math.floor(Math.random() * 30) + 20;
  
  return (
    <div className="flex flex-wrap items-center justify-between mt-6 pt-4 border-t border-gray-700/50 text-xs text-gray-400">
      <div className="flex items-center mr-3 mb-2 sm:mb-0">
        <Cpu size={12} className="mr-1" />
        <span>CPU: {randomLoad}%</span>
      </div>
      
      <div className="flex items-center mr-3 mb-2 sm:mb-0">
        <Signal size={12} className="mr-1" />
        <span>NETWORK: ONLINE</span>
      </div>
      
      <div className="flex items-center mb-2 sm:mb-0">
        {botActive ? (
          <Bot size={14} className="mr-1 text-green-400" />
        ) : (
          <BotOff size={14} className="mr-1 text-red-400" />
        )}
        <span className={botActive ? 'text-green-400' : 'text-red-400'}>
          BOT {botActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>
    </div>
  );
};
