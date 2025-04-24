
import React, { useEffect, useState } from 'react';
import { Loader2 } from "lucide-react";

const SyncStatusIndicator = () => {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [showIndicator, setShowIndicator] = useState(false);
  
  useEffect(() => {
    const handleRefreshing = () => {
      setSyncing(true);
      setMessage("Synchronisation en cours...");
      setShowIndicator(true);
    };
    
    const handleRefreshed = () => {
      setSyncing(false);
      setMessage("Données synchronisées");
      
      // Masquer après 2 secondes
      setTimeout(() => {
        setShowIndicator(false);
      }, 2000);
    };
    
    const handleSyncError = (event: any) => {
      setSyncing(false);
      setMessage("Erreur de synchronisation");
      setShowIndicator(true);
      
      // Masquer après 3 secondes
      setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
    };
    
    // Ces événements sont déclenchés pendant la synchronisation des données
    window.addEventListener('data:refreshing', handleRefreshing);
    window.addEventListener('data:refreshed', handleRefreshed);
    window.addEventListener('user:sync-error', handleSyncError);
    
    // Nettoyer les événements au démontage
    return () => {
      window.removeEventListener('data:refreshing', handleRefreshing);
      window.removeEventListener('data:refreshed', handleRefreshed);
      window.removeEventListener('user:sync-error', handleSyncError);
    };
  }, []);
  
  // Ne rien afficher si l'indicateur est caché
  if (!showIndicator) return null;
  
  return (
    <div className={`fixed bottom-4 right-4 bg-slate-800 text-white py-2 px-4 rounded-md shadow-lg flex items-center gap-2 transition-opacity duration-300 ${showIndicator ? 'opacity-100' : 'opacity-0'}`}>
      {syncing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : null}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default SyncStatusIndicator;
