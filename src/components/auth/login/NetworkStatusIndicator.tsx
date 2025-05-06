
import { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';

interface NetworkStatusProps {
  className?: string;
  hideErrorStates?: boolean;
}

const NetworkStatusIndicator = ({ className = '', hideErrorStates = false }: NetworkStatusProps) => {
  // Composant complètement invisible
  return null;
};

export default NetworkStatusIndicator;
