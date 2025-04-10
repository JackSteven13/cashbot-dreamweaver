import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserDataFetcher } from './useUserDataFetcher';
import { UserData } from '@/types/userData';
import { balanceManager, getHighestBalance } from '@/utils/balance/balanceManager';

export const useUserData = () => {
  const [userDataFetcher, userDataActions] = useUserDataFetcher();
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = userDataFetcher;
  const balanceSyncRef = useRef(false);
  const localBalanceRef = useRef<number | null>(null);
  const highestEverBalanceRef = useRef<number | null>(null);
  const transactionsGeneratedRef = useRef(false);
  
  useEffect(() => {
    userDataActions.fetchUserData().then(() => {
      if (userData) {
        if (isNewUser) {
          console.log("Nouveau utilisateur détecté - Initialisation du state à zéro");
          localStorage.removeItem('highestBalance');
          localStorage.removeItem('currentBalance');
          localStorage.removeItem('lastKnownBalance');
          localStorage.removeItem('lastBalanceUpdateTime');
          localStorage.removeItem('balanceState');
          
          localBalanceRef.current = 0;
          highestEverBalanceRef.current = 0;
          
          window.dispatchEvent(new CustomEvent('balance:force-sync', { 
            detail: { balance: 0 }
          }));
          
          return;
        }
        
        // Pour les utilisateurs existants, vérifier si nous avons déjà un solde en cache
        const highestBalance = getHighestBalance();
        const storedBalance = localStorage.getItem('currentBalance');
        const apiBalance = userData.balance || 0;
        
        // Déterminer la valeur maximale entre toutes ces sources
        const maxBalance = Math.max(
          highestBalance || 0,
          storedBalance ? parseFloat(storedBalance) : 0,
          apiBalance
        );
        
        console.log(`[useUserData] Max balance determined: ${maxBalance} (API: ${apiBalance}, Highest: ${highestBalance})`);
        
        // Si le solde maximum est supérieur au solde de l'API, synchroniser
        if (maxBalance > apiBalance) {
          console.log(`[useUserData] Restoring higher balance: ${maxBalance} (server: ${apiBalance})`);
          localBalanceRef.current = maxBalance;
          highestEverBalanceRef.current = maxBalance;
          
          // Toujours sauvegarder dans localStorage pour redondance
          localStorage.setItem('highestBalance', maxBalance.toString());
          localStorage.setItem('currentBalance', maxBalance.toString());
          localStorage.setItem('lastKnownBalance', maxBalance.toString());
          
          // Déclencher un événement global pour synchroniser l'UI
          window.dispatchEvent(new CustomEvent('balance:force-sync', { 
            detail: { balance: maxBalance }
          }));
        }
        
        balanceSyncRef.current = true;
      }
    });
    
    // Vérification périodique de la cohérence et réinitialisation à minuit
    const checkInterval = setInterval(() => {
      const now = new Date();
      
      // Réinitialisation à minuit
      if (now.getHours() === 0 && now.getMinutes() <= 5) {
        userDataActions.resetDailyCounters();
        
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
  }, []);
  
  // Quand userData change, mettre à jour nos références locales si nécessaire
  useEffect(() => {
    if (userData?.balance !== undefined) {
      const highestBalance = getHighestBalance();
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('currentBalance');
      const apiBalance = userData.balance;
      
      // Déterminer le solde maximum entre toutes les sources
      const maxBalance = Math.max(
        highestBalance || 0,
        storedHighestBalance ? parseFloat(storedHighestBalance) : 0,
        storedBalance ? parseFloat(storedBalance) : 0,
        apiBalance
      );
      
      localBalanceRef.current = maxBalance;
      highestEverBalanceRef.current = maxBalance;
      
      // Toujours sauvegarder pour persistance
      localStorage.setItem('highestBalance', maxBalance.toString());
      localStorage.setItem('currentBalance', maxBalance.toString());
      localStorage.setItem('lastKnownBalance', maxBalance.toString());
      
      // Si différence significative, forcer la synchronisation de l'UI
      if (Math.abs(apiBalance - maxBalance) > 0.01) {
        console.log(`[useUserData] Syncing UI with correct balance: ${maxBalance} (API: ${apiBalance})`);
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: maxBalance }
        }));
      }
      
      // Vérifier si nous avons des transactions et générer des transactions historiques si nécessaire
      import('@/utils/initialTransactionsGenerator').then(module => {
        if (!transactionsGeneratedRef.current && 
            !isNewUser && 
            userData && 
            userData.balance > 0 && 
            (!userData.transactions || userData.transactions.length === 0)) {
          
          console.log("Solde positif mais aucune transaction, génération de l'historique...");
          transactionsGeneratedRef.current = true;
          
          module.generateInitialTransactions(userData.id, userData.balance)
            .then(success => {
              if (success) {
                console.log("Transactions d'historique générées avec succès");
                // Recharger les données pour afficher les nouvelles transactions
                setTimeout(() => userDataActions.fetchUserData(), 1000);
              }
            });
        }
      });
    }
  }, [userData?.balance, userData?.transactions, isNewUser, userData?.id, userDataActions]);
  
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    await userDataActions.fetchUserData();
    return true;
  }, [userDataActions]);
  
  const incrementSessionCount = useCallback(async (): Promise<void> => {
    await refreshUserData();
  }, [refreshUserData]);
  
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate: boolean = false): Promise<void> => {
    if (isNewUser) {
      console.log("Tentative de mise à jour du solde pour un nouvel utilisateur - forcé à 0");
      return;
    }
    
    const positiveGain = Math.max(0, gain);
    
    if (userData?.balance !== undefined) {
      // Obtenir le solde le plus à jour possible
      const highestBalance = getHighestBalance();
      const currentBalance = Math.max(
        localBalanceRef.current || 0,
        highestBalance || 0,
        userData.balance
      );
      
      const newBalance = currentBalance + positiveGain;
      
      // Mettre à jour le gestionnaire central de solde
      balanceManager.updateBalance(positiveGain);
      
      // Toujours sauvegarder dans localStorage
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      
      // Mettre à jour notre référence
      localBalanceRef.current = newBalance;
      highestEverBalanceRef.current = newBalance;
      
      console.log(`[useUserData] Balance updated locally: ${currentBalance} + ${positiveGain} = ${newBalance}`);
      
      // Forcer la mise à jour de l'UI si demandé
      if (forceUpdate) {
        window.dispatchEvent(new CustomEvent('balance:force-update', { 
          detail: { newBalance: newBalance }
        }));
      }
    }
    
    await refreshUserData();
  }, [refreshUserData, userData?.balance, isNewUser]);
  
  const resetBalance = useCallback(async (): Promise<void> => {
    // Effacer toutes les références au solde
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('lastBalanceUpdateTime');
    localStorage.removeItem('highestBalance');
    localStorage.removeItem('balanceState');
    
    localBalanceRef.current = null;
    highestEverBalanceRef.current = null;
    
    // Réinitialiser le gestionnaire central
    balanceManager.resetBalance();
    
    // Forcer une mise à jour complète depuis la BD
    await refreshUserData();
  }, [refreshUserData]);
  
  // Toujours utiliser le solde le plus élevé pour l'affichage
  const effectiveBalance = isNewUser ? 
    0 : 
    Math.max(
      localBalanceRef.current || 0,
      getHighestBalance() || 0,
      userData?.balance || 0
    );
  
  return {
    userData: userData ? {
      ...userData,
      balance: effectiveBalance
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

export default useUserData;
