
import { useState, useCallback } from 'react';
import { useUserDataFetcher } from '../useUserDataFetcher';
import balanceManager from '@/utils/balance/balanceManager';

/**
 * Hook pour gérer l'état des données utilisateur
 */
export const useUserDataState = () => {
  const [userDataFetcher, userDataActions] = useUserDataFetcher();
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = userDataFetcher;
  
  // Méthode pour rafraîchir les données utilisateur
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    await userDataActions.fetchUserData();
    return true;
  }, [userDataActions]);
  
  // Méthodes pour gérer le solde utilisateur
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate: boolean = false): Promise<void> => {
    if (isNewUser) {
      console.log("Tentative de mise à jour du solde pour un nouvel utilisateur - forcé à 0");
      return;
    }
    
    const positiveGain = Math.max(0, gain);
    
    if (userData?.balance !== undefined) {
      // Mettre à jour le gestionnaire central de solde
      balanceManager.updateBalance(positiveGain);
      
      // Forcer la mise à jour de l'UI si demandé
      if (forceUpdate) {
        window.dispatchEvent(new CustomEvent('balance:force-update', { 
          detail: { newBalance: userData.balance + positiveGain }
        }));
      }
    }
    
    await refreshUserData();
  }, [refreshUserData, userData?.balance, isNewUser]);
  
  // Méthode pour réinitialiser le solde
  const resetBalance = useCallback(async (): Promise<void> => {
    // Réinitialiser le gestionnaire central
    balanceManager.resetBalance();
    
    // Forcer une mise à jour complète depuis la BD
    await refreshUserData();
  }, [refreshUserData]);
  
  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    userActions: {
      ...userDataActions,
      updateBalance,
      resetBalance
    },
    refreshUserData
  };
};
