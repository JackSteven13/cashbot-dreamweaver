
import { useCallback } from 'react';
import { useUserDataState } from './useUserDataState';
import { useBalanceSynchronization } from './useBalanceSynchronization';
import { usePeriodicChecks } from './usePeriodicChecks';

/**
 * Hook principal pour gérer les données utilisateur avec une meilleure organisation
 */
export const useUserData = () => {
  // Utiliser les hooks individuels pour chaque fonctionnalité
  const { 
    userData, isNewUser, dailySessionCount, showLimitAlert, isLoading, isBotActive,
    dailyLimitProgress, userActions, refreshUserData: fetchUserData, generateAutomaticRevenue
  } = useUserDataState();
  
  // Synchronisation du solde
  const { effectiveBalance } = useBalanceSynchronization(userData, isNewUser);
  
  // Vérifications périodiques
  usePeriodicChecks(userData, refreshUserData);
  
  // Wrapper pour refreshUserData qui retourne un boolean
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    try {
      await fetchUserData();
      return true;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
      return false;
    }
  }, [fetchUserData]);
  
  // Méthode pour incrémenter le nombre de sessions
  const incrementSessionCount = useCallback(async (): Promise<void> => {
    await refreshUserData();
  }, [refreshUserData]);
  
  // Méthode pour mettre à jour le solde utilisateur
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate: boolean = false): Promise<void> => {
    await userActions.updateBalance(gain, report, forceUpdate);
    await refreshUserData();
  }, [userActions, refreshUserData]);
  
  // Méthode pour réinitialiser le solde
  const resetBalance = useCallback(async (): Promise<void> => {
    await userActions.resetBalance();
    await refreshUserData();
  }, [userActions, refreshUserData]);
  
  // Construction du résultat avec le solde effectif
  const enhancedUserData = userData ? {
    ...userData,
    balance: effectiveBalance
  } : null;
  
  return {
    userData: enhancedUserData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue,
    setShowLimitAlert: userActions.setShowLimitAlert,
    refreshUserData,
    incrementSessionCount,
    updateBalance,
    resetBalance,
    resetDailyCounters: userActions.resetDailyCounters
  };
};

export default useUserData;
