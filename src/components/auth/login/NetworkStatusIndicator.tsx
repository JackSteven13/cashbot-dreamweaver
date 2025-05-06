
import { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';

interface NetworkStatusProps {
  className?: string;
  hideErrorStates?: boolean;
}

const NetworkStatusIndicator = ({ className = '', hideErrorStates = false }: NetworkStatusProps) => {
  // Toujours afficher un statut connecté
  return (
    <div className={`flex items-center gap-1 px-2 py-1 text-xs bg-green-600/20 text-green-500 rounded-md ${className}`}>
      <Wifi size={12} />
      <span>Connecté</span>
    </div>
  );
};

export default NetworkStatusIndicator;
