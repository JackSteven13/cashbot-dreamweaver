
import React from 'react';
import { Network, Bot, TrendingUp, ChevronsUp } from 'lucide-react';

interface GainsDisplayProps {
  networkGains: number;
  botGains: number;
}

const GainsDisplay: React.FC<GainsDisplayProps> = ({ networkGains, botGains }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div className="bg-emerald-900/20 backdrop-blur-sm rounded-lg p-3 border border-emerald-800/30 flex justify-between items-center group hover:bg-emerald-900/30 transition-all duration-300">
        <div>
          <div className="text-xs text-white/70 mb-1 flex items-center">
            <Network className="h-3 w-3 mr-1 text-emerald-400 group-hover:animate-pulse" />
            Gains réseau
          </div>
          <div className="font-medium text-emerald-300">{networkGains.toFixed(2)}€</div>
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-400/70" />
      </div>
      
      <div className="bg-blue-900/20 backdrop-blur-sm rounded-lg p-3 border border-blue-800/30 flex justify-between items-center group hover:bg-blue-900/30 transition-all duration-300">
        <div>
          <div className="text-xs text-white/70 mb-1 flex items-center">
            <Bot className="h-3 w-3 mr-1 text-blue-400 group-hover:animate-pulse" />
            Gains bots*
          </div>
          <div className="font-medium text-blue-300">{botGains.toFixed(2)}€</div>
        </div>
        <ChevronsUp className="h-4 w-4 text-blue-400/70" />
      </div>
    </div>
  );
};

export default GainsDisplay;
