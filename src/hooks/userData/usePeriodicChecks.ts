
import { useEffect } from 'react';
import { UserData } from '@/types/userData';
import balanceManager, { getHighestBalance } from '@/utils/balance/balanceManager';

/**
 * Hook pour gérer les vérifications périodiques
 */
export const usePeriodicChecks = (
  userData: UserData | null,
  refreshUserData: () => Promise<boolean>
) => {
  // Effet pour les vérifications périodiques
  useEffect(() => {
    // Vérification périodique de la cohérence et réinitialisation à minuit
    const checkInterval = setInterval(() => {
      const now = new Date();
      
      // Réinitialisation à minuit
      if (now.getHours() === 0 && now.getMinutes() <= 5) {
        // Ne pas réinitialiser le solde, seulement les compteurs quotidiens
        balanceManager.resetDailyCounters();
      }
      
      // Vérification de cohérence toutes les minutes
      const highestBalance = getHighestBalance();
      const currentDb = userData?.balance || 0;
      
      // Si notre solde local est plus élevé que celui dans la BD, forcer la synchronisation
      if (highestBalance > currentDb) {
        console.log(`[useUserData] Balance inconsistency: local=${highestBalance}, db=${currentDb}. Forcing sync...`);
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: highestBalance }
        }));
      }
    }, 60000);
    
    return () => clearInterval(checkInterval);
  }, [userData, refreshUserData]);
};
