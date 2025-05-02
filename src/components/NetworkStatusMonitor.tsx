
import { useEffect, useState, useCallback } from 'react';
import { getNetworkStatus } from '@/utils/auth/networkUtils';

export const NetworkStatusMonitor = () => {
  // Vérifier le réseau et la résolution DNS silencieusement
  const checkNetwork = useCallback(async () => {
    try {
      // Vérification en arrière-plan sans affichage à l'utilisateur
      await getNetworkStatus(true);
    } catch (error) {
      console.error("Error checking network status:", error);
    }
  }, []);
  
  useEffect(() => {
    const handleOnline = () => {
      checkNetwork();
    };
    
    const handleOffline = () => {
      // Ne rien afficher à l'utilisateur, juste logger pour debug
      console.log("Connection lost, waiting for reconnection");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Vérification initiale
    checkNetwork();
    
    // Vérification périodique en arrière-plan
    const intervalId = setInterval(checkNetwork, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkNetwork]);
  
  // Ne rien rendre dans l'interface utilisateur
  return null;
};

export default NetworkStatusMonitor;
