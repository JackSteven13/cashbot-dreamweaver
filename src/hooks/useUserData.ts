import { useState, useEffect, useCallback } from 'react';
import { useUserDataFetcher } from './useUserDataFetcher';
import { UserData } from '@/types/userData';

export const useUserData = () => {
  const [userDataFetcher, userDataActions] = useUserDataFetcher();
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = userDataFetcher;
  
  // Récupérer les données lors du chargement de la page
  useEffect(() => {
    userDataActions.fetchUserData();
    
    // Ajouter une vérification périodique pour la réinitialisation quotidienne
    const checkInterval = setInterval(() => {
      const now = new Date();
      // Vérifier si c'est un nouveau jour (minuit)
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        userDataActions.resetDailyCounters();
      }
    }, 60000); // Vérifier chaque minute
    
    return () => clearInterval(checkInterval);
  }, []);
  
  // Handler pour rafraîchir les données
  const refreshUserData = useCallback(async () => {
    await userDataActions.fetchUserData();
  }, [userDataActions]);
  
  // Handler pour incrémenter le compteur de sessions
  const incrementSessionCount = useCallback(async () => {
    // Implémenter la logique pour incrémenter le compteur de sessions
    // Pour l'instant, on rafraîchit simplement les données
    await refreshUserData();
    return dailySessionCount + 1;
  }, [dailySessionCount, refreshUserData]);
  
  // Handler pour mettre à jour le solde
  const updateBalance = useCallback(async (gain: number, report: string) => {
    // Implémenter la logique pour mettre à jour le solde
    // Pour l'instant, on rafraîchit simplement les données
    await refreshUserData();
  }, [refreshUserData]);
  
  // Handler pour réinitialiser le solde
  const resetBalance = useCallback(async () => {
    // Implémenter la logique pour réinitialiser le solde
    await refreshUserData();
  }, [refreshUserData]);
  
  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    setShowLimitAlert: userDataActions.setShowLimitAlert,
    refreshUserData,
    incrementSessionCount,
    updateBalance,
    resetBalance,
    resetDailyCounters: userDataActions.resetDailyCounters
  };
};
