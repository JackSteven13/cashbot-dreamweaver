
import React from 'react';

interface GainsDisplayProps {
  networkGains: number;
  botGains: number;
}

const GainsDisplay: React.FC<GainsDisplayProps> = ({
  networkGains = 0,
  botGains = 0
}) => {
  // Ensure we have valid numbers
  const safeNetworkGains = typeof networkGains === 'number' ? networkGains : 0;
  const safeBotGains = typeof botGains === 'number' ? botGains : 0;
  
  // Format numbers safely
  const formattedNetworkGains = safeNetworkGains.toFixed(2);
  const formattedBotGains = safeBotGains.toFixed(2);
  
  return (
    <div className="mt-4 px-1">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-300">Gains réseau</span>
        <span className="text-blue-300">{formattedNetworkGains}€</span>
      </div>
      
      <div className="flex justify-between text-xs">
        <span className="text-gray-300">Gains bots*</span>
        <span className="text-blue-300">{formattedBotGains}€</span>
      </div>
    </div>
  );
};

export default GainsDisplay;
