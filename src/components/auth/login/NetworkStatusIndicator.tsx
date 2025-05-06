
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { checkNetworkStatus } from '@/integrations/supabase/client';

interface NetworkStatusProps {
  className?: string;
}

const NetworkStatusIndicator = ({ className = '' }: NetworkStatusProps) => {
  const [status, setStatus] = useState<{online: boolean; supabaseReachable: boolean}>({
    online: navigator.onLine,
    supabaseReachable: false
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await checkNetworkStatus();
      setStatus(result);
    } catch (e) {
      console.error("Erreur lors de la vérification du réseau:", e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, online: true }));
      checkStatus();
    };
    
    const handleOffline = () => {
      setStatus({ online: false, supabaseReachable: false });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Vérifier régulièrement le statut
    const interval = setInterval(checkStatus, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!status.online) {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 text-xs bg-red-600/20 text-red-500 rounded-md ${className}`}>
        <WifiOff size={12} />
        <span>Hors ligne</span>
      </div>
    );
  }
  
  if (!status.supabaseReachable) {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 text-xs bg-yellow-600/20 text-yellow-500 rounded-md ${className}`}>
        <AlertTriangle size={12} />
        <span>Problème de connexion</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 px-2 py-1 text-xs bg-green-600/20 text-green-500 rounded-md ${className}`}>
      <Wifi size={12} />
      <span>Connecté</span>
    </div>
  );
};

export default NetworkStatusIndicator;
