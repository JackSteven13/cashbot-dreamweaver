
import { useEffect } from 'react';
import { UserData } from '@/types/userData';

/**
 * Hook pour exécuter des vérifications périodiques sur les données utilisateur
 */
export const usePeriodicChecks = (
  userData: UserData | null,
  refreshUserData: () => Promise<boolean>
) => {
  // Vérification périodique pour maintenir les données à jour
  useEffect(() => {
    // Exécuter uniquement si nous avons déjà des données utilisateur
    if (!userData) return;
    
    // Configurer la vérification périodique une fois par minute
    const checkInterval = setInterval(() => {
      console.log("Vérification périodique des données utilisateur");
      refreshUserData().then(success => {
        if (!success) {
          console.log("Échec de la vérification périodique");
        }
      });
    }, 60000); // Une fois par minute
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [userData, refreshUserData]);
  
  // Effet pour surveiller les changements globaux de solde
  useEffect(() => {
    const handleBalanceSync = (event: CustomEvent) => {
      console.log("Synchronisation de solde demandée par un événement externe");
      refreshUserData();
    };
    
    window.addEventListener('balance:force-sync' as any, handleBalanceSync);
    
    return () => {
      window.removeEventListener('balance:force-sync' as any, handleBalanceSync);
    };
  }, [refreshUserData]);
};
