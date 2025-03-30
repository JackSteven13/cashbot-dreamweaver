
import React from 'react';
import { Bot, Cpu } from 'lucide-react';

interface SystemIndicatorsProps {
  showAnalysis: boolean;
}

export const SystemIndicators: React.FC<SystemIndicatorsProps> = ({ showAnalysis }) => {
  return (
    <div className="flex items-center justify-between mt-4 text-xs text-white/60">
      <div className="flex items-center">
        <Bot size={12} className="mr-1 text-[#9b87f5]" />
        <span>Bots actifs: {Math.floor(Math.random() * 5) + 3}</span>
      </div>
      <div className="flex items-center">
        <Cpu size={12} className="mr-1 text-[#9b87f5]" />
        <span>Système: {showAnalysis ? (
          <span className="text-green-400">Analyse en cours</span>
        ) : (
          <span>En attente</span>
        )}</span>
      </div>
    </div>
  );
};
