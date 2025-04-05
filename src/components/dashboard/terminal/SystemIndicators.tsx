
import React, { useState, useEffect } from 'react';
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
  
  // State local pour suivre l'état du bot
  const [localBotActive, setLocalBotActive] = useState(botActive);
  
  // Écouter les événements de changement d'état du bot
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        console.log(`SystemIndicators received bot status update: ${isActive ? 'active' : 'inactive'}`);
        setLocalBotActive(isActive);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    
    // Synchroniser avec la prop botActive au montage et lorsqu'elle change
    setLocalBotActive(botActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
    };
  }, [botActive]);
  
  // Function to toggle bot status manually
  const handleBotToggle = () => {
    const newStatus = !localBotActive;
    console.log(`Toggling bot status from SystemIndicators: ${localBotActive} to ${newStatus}`);
    
    // Dispatch global event to sync state across components
    window.dispatchEvent(new CustomEvent('bot:external-status-change', {
      detail: { active: newStatus }
    }));
    
    // No need to update local state here as it will be updated by the event handler above
  };
  
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
      
      <div 
        className="flex items-center mb-2 sm:mb-0 cursor-pointer" 
        onClick={handleBotToggle}
        title="Cliquez pour activer/désactiver l'analyse automatique"
      >
        {localBotActive ? (
          <Bot size={14} className="mr-1 text-green-400" />
        ) : (
          <BotOff size={14} className="mr-1 text-red-400" />
        )}
        <span className={localBotActive ? 'text-green-400' : 'text-red-400'}>
          BOT {localBotActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>
    </div>
  );
};
