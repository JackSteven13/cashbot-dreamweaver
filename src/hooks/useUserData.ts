
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserDataFetcher } from './useUserDataFetcher';
import { UserData } from '@/types/userData';

export const useUserData = () => {
  const [userDataFetcher, userDataActions] = useUserDataFetcher();
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = userDataFetcher;
  const balanceSyncRef = useRef(false);
  const localBalanceRef = useRef<number | null>(null);
  const highestEverBalanceRef = useRef<number | null>(null);
  
  // Récupérer les données lors du chargement de la page
  useEffect(() => {
    userDataActions.fetchUserData().then(() => {
      // After fetching data, check if we need to restore balance from localStorage
      if (userData) {
        // Récupérer toutes les données de localStorage pour le solde
        const storedHighestBalance = localStorage.getItem('highestBalance');
        const storedBalance = localStorage.getItem('currentBalance');
        const storedLastKnownBalance = localStorage.getItem('lastKnownBalance');
        
        // Déterminer le solde max entre toutes les sources
        let maxBalance = userData.balance;
        
        if (storedHighestBalance) {
          const parsed = parseFloat(storedHighestBalance);
          if (!isNaN(parsed) && parsed > maxBalance) {
            maxBalance = parsed;
          }
        }
        
        if (storedBalance) {
          const parsed = parseFloat(storedBalance);
          if (!isNaN(parsed) && parsed > maxBalance) {
            maxBalance = parsed;
          }
        }
        
        if (storedLastKnownBalance) {
          const parsed = parseFloat(storedLastKnownBalance);
          if (!isNaN(parsed) && parsed > maxBalance) {
            maxBalance = parsed;
          }
        }
        
        // Si on a trouvé un solde supérieur, l'utiliser
        if (maxBalance > userData.balance) {
          console.log(`Restoring balance from localStorage: ${maxBalance} (server balance: ${userData.balance})`);
          localBalanceRef.current = maxBalance;
          highestEverBalanceRef.current = maxBalance;
          
          // S'assurer que toutes les sources sont synchronisées avec la valeur max
          localStorage.setItem('highestBalance', maxBalance.toString());
          localStorage.setItem('currentBalance', maxBalance.toString());
          localStorage.setItem('lastKnownBalance', maxBalance.toString());
          
          // Déclencher une synchronisation globale avec le solde correct
          window.dispatchEvent(new CustomEvent('balance:force-sync', { 
            detail: { balance: maxBalance }
          }));
        }
        
        balanceSyncRef.current = true;
      }
    });
    
    // Ajouter une vérification périodique pour la réinitialisation quotidienne
    const checkInterval = setInterval(() => {
      const now = new Date();
      // Vérifier si c'est un nouveau jour (minuit)
      if (now.getHours() === 0 && now.getMinutes() <= 5) {
        userDataActions.resetDailyCounters();
        
        // Également, synchroniser le solde global
        const maxBalance = highestEverBalanceRef.current || localBalanceRef.current || (userData?.balance ?? 0);
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: maxBalance }
        }));
      }
    }, 60000); // Vérifier chaque minute
    
    return () => clearInterval(checkInterval);
  }, []);
  
  // Synchronize with localStorage when balance changes
  useEffect(() => {
    if (userData?.balance !== undefined) {
      // Récupérer le solde le plus élevé parmi toutes les sources
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('currentBalance');
      const storedLastKnownBalance = localStorage.getItem('lastKnownBalance');
      
      // Calculer le maximum
      let maxCurrentBalance = userData.balance;
      
      if (storedHighestBalance) {
        const parsed = parseFloat(storedHighestBalance);
        if (!isNaN(parsed) && parsed > maxCurrentBalance) {
          maxCurrentBalance = parsed;
        }
      }
      
      if (storedBalance) {
        const parsed = parseFloat(storedBalance);
        if (!isNaN(parsed) && parsed > maxCurrentBalance) {
          maxCurrentBalance = parsed;
        }
      }
      
      if (storedLastKnownBalance) {
        const parsed = parseFloat(storedLastKnownBalance);
        if (!isNaN(parsed) && parsed > maxCurrentBalance) {
          maxCurrentBalance = parsed;
        }
      }
      
      // Mettre à jour notre référence locale avec la valeur maximale
      localBalanceRef.current = maxCurrentBalance;
      
      // Mettre à jour aussi la référence de solde maximum si nécessaire
      if (highestEverBalanceRef.current === null || maxCurrentBalance > highestEverBalanceRef.current) {
        highestEverBalanceRef.current = maxCurrentBalance;
      }
      
      // S'assurer que localStorage est à jour avec la valeur maximale
      localStorage.setItem('highestBalance', highestEverBalanceRef.current.toString());
      localStorage.setItem('currentBalance', maxCurrentBalance.toString());
      localStorage.setItem('lastKnownBalance', maxCurrentBalance.toString());
      
      // Déclencher une synchronisation globale si la valeur est significativement différente
      if (Math.abs((userData.balance || 0) - maxCurrentBalance) > 0.01) {
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: maxCurrentBalance }
        }));
      }
      
      console.log(`[useUserData] Current max balance: ${maxCurrentBalance}, API balance: ${userData.balance}`);
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
    // S'assurer que le gain est toujours positif
    const positiveGain = Math.max(0, gain);
    
    // Persist balance to localStorage before API call
    if (userData?.balance !== undefined) {
      // Calculer le nouveau solde en tenant compte de l'historique
      const currentMaxBalance = localBalanceRef.current !== null ? 
        localBalanceRef.current : userData.balance;
      
      const newBalance = currentMaxBalance + positiveGain;
      
      // Mettre à jour les valeurs dans localStorage
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      
      // Mettre à jour aussi la référence de solde maximum
      if (highestEverBalanceRef.current === null || newBalance > highestEverBalanceRef.current) {
        highestEverBalanceRef.current = newBalance;
        localStorage.setItem('highestBalance', newBalance.toString());
      }
      
      // Mettre à jour immédiatement la référence locale pour l'interface utilisateur
      localBalanceRef.current = newBalance;
      
      console.log(`Balance updated locally: ${currentMaxBalance} + ${positiveGain} = ${newBalance}`);
      
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
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('lastBalanceUpdateTime');
    localStorage.removeItem('highestBalance');
    
    // Reset local reference
    localBalanceRef.current = null;
    highestEverBalanceRef.current = null;
    
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
