
import { useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';

export const usePeriodicChecks = (
  userData: UserData | null, 
  refreshUserData: () => Promise<void>
) => {
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Configurer des vérifications périodiques pour la synchronisation
  useEffect(() => {
    // Ne pas démarrer de synchronisation s'il n'y a pas de données utilisateur
    if (!userData) return;
    
    // Synchroniser immédiatement au démarrage
    const initialTimer = setTimeout(() => {
      balanceManager.syncWithDatabase();
    }, 5000);
    
    // Configurer la synchronisation périodique
    syncIntervalRef.current = setInterval(() => {
      // Synchroniser le solde avec la base de données toutes les 5 minutes
      balanceManager.syncWithDatabase();
      
      // Rafraîchir les données utilisateur toutes les 15 minutes
      const now = new Date();
      const minutes = now.getMinutes();
      if (minutes % 15 === 0) {
        refreshUserData();
      }
    }, 300000); // 5 minutes
    
    // Nettoyage à la destruction
    return () => {
      clearTimeout(initialTimer);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [userData, refreshUserData]);
  
  return null; // Ce hook ne retourne pas d'état
};
