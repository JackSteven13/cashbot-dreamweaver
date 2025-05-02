
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getNetworkStatus, showNetworkStatusToast, showDnsTroubleshootingToast } from '@/utils/auth/networkUtils';
import { NetworkStatusAlert } from '@/components/ui/alert-dns';

export const NetworkStatusMonitor = () => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    dnsWorking: true,
    showAlert: false
  });
  
  // Vérifier le réseau et la résolution DNS
  const checkNetwork = useCallback(async () => {
    try {
      const status = await getNetworkStatus(true);
      
      // Mettre à jour l'état
      setNetworkStatus(prev => ({
        isOnline: status.isOnline,
        dnsWorking: status.dnsWorking,
        // N'afficher l'alerte que s'il y a un problème
        showAlert: !status.dnsWorking || !status.isOnline
      }));
      
      // Si le statut a changé négativement, afficher une notification
      if (!status.isOnline || !status.dnsWorking) {
        showNetworkStatusToast(status);
      }
    } catch (error) {
      console.error("Error checking network status:", error);
    }
  }, []);
  
  // Gestion de l'aide DNS
  const handleDnsHelp = useCallback(() => {
    showDnsTroubleshootingToast();
  }, []);
  
  // Gestionnaires d'événements en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
      checkNetwork();
    };
    
    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false, showAlert: true }));
      toast.error("Connexion internet perdue");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Vérification initiale
    checkNetwork();
    
    // Vérification périodique
    const intervalId = setInterval(checkNetwork, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkNetwork]);
  
  // N'afficher l'alerte que si nécessaire
  if (!networkStatus.showAlert) {
    return null;
  }
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 mx-auto max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
      <NetworkStatusAlert 
        isOnline={networkStatus.isOnline} 
        onHelp={handleDnsHelp}
        className="shadow-lg"
      />
    </div>
  );
};

export default NetworkStatusMonitor;
