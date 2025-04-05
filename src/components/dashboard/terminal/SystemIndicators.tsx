
import React from 'react';
import { Cpu, Signal, Zap } from 'lucide-react';

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
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/50 text-xs text-gray-400">
      <div className="flex items-center">
        <Cpu size={12} className="mr-1" />
        <span>CPU: {randomLoad}%</span>
      </div>
      
      <div className="flex items-center">
        <Signal size={12} className="mr-1" />
        <span>NETWORK: ONLINE</span>
      </div>
      
      <div className="flex items-center">
        <Zap size={12} className={`mr-1 ${botActive ? 'text-green-400' : 'text-red-400'}`} />
        <span className={botActive ? 'text-green-400' : 'text-red-400'}>
          {botActive ? 'BOT ACTIVE' : 'BOT INACTIVE'}
        </span>
      </div>
    </div>
  );
};
