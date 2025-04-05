
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserDataFetcher } from './useUserDataFetcher';
import { UserData } from '@/types/userData';

export const useUserData = () => {
  const [userDataFetcher, userDataActions] = useUserDataFetcher();
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = userDataFetcher;
  const balanceSyncRef = useRef(false);
  const localBalanceRef = useRef<number | null>(null);
  
  // Récupérer les données lors du chargement de la page
  useEffect(() => {
    userDataActions.fetchUserData().then(() => {
      // After fetching data, check if we need to restore balance from localStorage
      if (userData && !balanceSyncRef.current) {
        const storedBalance = localStorage.getItem('currentBalance');
        if (storedBalance) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance) && parsedBalance > userData.balance) {
            console.log(`Restoring balance from localStorage: ${parsedBalance} (server balance: ${userData.balance})`);
            // If stored balance is higher, use it
            localBalanceRef.current = parsedBalance;
            userDataActions.fetchUserData(); // Fetch user data again
          }
        }
        balanceSyncRef.current = true;
      }
    });
    
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
  
  // Synchronize with localStorage when balance changes
  useEffect(() => {
    if (userData?.balance !== undefined) {
      const storedBalance = localStorage.getItem('currentBalance');
      const parsedStored = storedBalance ? parseFloat(storedBalance) : 0;
      
      // Only update localStorage if our balance is higher
      if (!storedBalance || userData.balance > parsedStored) {
        localStorage.setItem('currentBalance', userData.balance.toString());
        localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      }
      
      // Mettre à jour notre référence locale
      localBalanceRef.current = Math.max(userData.balance, parsedStored);
    }
  }, [userData?.balance]);
  
  // Handler pour rafraîchir les données
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    await userDataActions.fetchUserData();
    return true; // Return boolean to match required type
  }, [userDataActions]);
  
  // Handler pour incrémenter le compteur de sessions
  const incrementSessionCount = useCallback(async (): Promise<void> => {
    // Pour l'instant, on rafraîchit simplement les données
    await refreshUserData();
  }, [refreshUserData]);
  
  // Handler pour mettre à jour le solde
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate: boolean = false): Promise<void> => {
    // Persist balance to localStorage before API call
    if (userData?.balance !== undefined) {
      const newBalance = userData.balance + gain;
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      
      // Mettre à jour immédiatement la référence locale pour l'interface utilisateur
      localBalanceRef.current = newBalance;
      
      console.log(`Balance updated locally: ${userData.balance} + ${gain} = ${newBalance}`);
      
      // Déclencher un événement pour notifier les composants d'interface utilisateur
      if (forceUpdate) {
        window.dispatchEvent(new CustomEvent('balance:force-update', { 
          detail: { newBalance: newBalance }
        }));
      }
    }
    
    // Now refresh data to update from API
    await refreshUserData();
  }, [refreshUserData, userData?.balance]);
  
  // Handler pour réinitialiser le solde
  const resetBalance = useCallback(async (): Promise<void> => {
    // Clear local storage on reset
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastBalanceUpdateTime');
    
    // Reset local reference
    localBalanceRef.current = null;
    
    // Implémenter la logique pour réinitialiser le solde
    await refreshUserData();
  }, [refreshUserData]);
  
  // Calculer le solde à afficher (utiliser la valeur locale si disponible)
  const effectiveBalance = localBalanceRef.current !== null ? 
    localBalanceRef.current : 
    (userData?.balance || 0);
  
  return {
    userData: userData ? {
      ...userData,
      balance: effectiveBalance // Override balance with local value if available
    } : null,
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
