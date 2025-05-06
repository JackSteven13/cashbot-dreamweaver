
import { useEffect } from 'react';

// Version simplifiée qui ne fait rien
export const NetworkStatusMonitor = () => {
  useEffect(() => {
    // Ne rien faire pour éviter les problèmes de connexion
    return () => {};
  }, []);
  
  // Ne rien rendre
  return null;
};

export default NetworkStatusMonitor;
