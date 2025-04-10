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
        
        const highestBalance = getHighestBalance();
        const storedBalance = localStorage.getItem('currentBalance');
        const apiBalance = userData.balance || 0;
        
        const maxBalance = Math.max(
          highestBalance || 0,
          storedBalance ? parseFloat(storedBalance) : 0,
          apiBalance
        );
        
        console.log(`[useUserData] Max balance determined: ${maxBalance} (API: ${apiBalance}, Highest: ${highestBalance})`);
        
        if (maxBalance > apiBalance) {
          console.log(`[useUserData] Restoring higher balance: ${maxBalance} (server: ${apiBalance})`);
          localBalanceRef.current = maxBalance;
          highestEverBalanceRef.current = maxBalance;
          
          localStorage.setItem('highestBalance', maxBalance.toString());
          localStorage.setItem('currentBalance', maxBalance.toString());
          localStorage.setItem('lastKnownBalance', maxBalance.toString());
          
          window.dispatchEvent(new CustomEvent('balance:force-sync', { 
            detail: { balance: maxBalance }
          }));
        }
        
        balanceSyncRef.current = true;
      }
    });
    
    const checkInterval = setInterval(() => {
      const now = new Date();
      
      if (now.getHours() === 0 && now.getMinutes() <= 5) {
        userDataActions.resetDailyCounters();
        balanceManager.resetDailyCounters();
      }
      
      const highestBalance = getHighestBalance();
      const currentDb = userData?.balance || 0;
      
      if (highestBalance > currentDb) {
        console.log(`[useUserData] Balance inconsistency: local=${highestBalance}, db=${currentDb}. Forcing sync...`);
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: highestBalance }
        }));
      }
    }, 60000);
    
    return () => clearInterval(checkInterval);
  }, []);
  
  useEffect(() => {
    if (userData?.balance !== undefined) {
      const highestBalance = getHighestBalance();
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('currentBalance');
      const apiBalance = userData.balance;
      
      const maxBalance = Math.max(
        highestBalance || 0,
        storedHighestBalance ? parseFloat(storedHighestBalance) : 0,
        storedBalance ? parseFloat(storedBalance) : 0,
        apiBalance
      );
      
      localBalanceRef.current = maxBalance;
      highestEverBalanceRef.current = maxBalance;
      
      localStorage.setItem('highestBalance', maxBalance.toString());
      localStorage.setItem('currentBalance', maxBalance.toString());
      localStorage.setItem('lastKnownBalance', maxBalance.toString());
      
      if (Math.abs(apiBalance - maxBalance) > 0.01) {
        console.log(`[useUserData] Syncing UI with correct balance: ${maxBalance} (API: ${apiBalance})`);
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: maxBalance }
        }));
      }
      
      import('@/utils/initialTransactionsGenerator').then(module => {
        if (!transactionsGeneratedRef.current && 
            !isNewUser && 
            userData && 
            userData.balance > 0 && 
            (!userData.transactions || userData.transactions.length === 0)) {
          
          console.log("Solde positif mais aucune transaction, génération de l'historique...");
          transactionsGeneratedRef.current = true;
          
          const userId = userData.id || (userData.profile?.id || '');
          if (userId) {
            module.generateInitialTransactions(userId, userData.balance)
              .then(success => {
                if (success) {
                  console.log("Transactions d'historique générées avec succès");
                  setTimeout(() => userDataActions.fetchUserData(), 1000);
                }
              });
          } else {
            console.error("Cannot generate transactions: missing user ID");
          }
        }
      });
    }
  }, [userData?.balance, userData?.transactions, isNewUser, userData?.id, userData?.profile?.id, userDataActions]);
  
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
      const highestBalance = getHighestBalance();
      const currentBalance = Math.max(
        localBalanceRef.current || 0,
        highestBalance || 0,
        userData.balance
      );
      
      const newBalance = currentBalance + positiveGain;
      
      balanceManager.updateBalance(positiveGain);
      
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      
      localBalanceRef.current = newBalance;
      highestEverBalanceRef.current = newBalance;
      
      console.log(`[useUserData] Balance updated locally: ${currentBalance} + ${positiveGain} = ${newBalance}`);
      
      if (forceUpdate) {
        window.dispatchEvent(new CustomEvent('balance:force-update', { 
          detail: { newBalance: newBalance }
        }));
      }
    }
    
    await refreshUserData();
  }, [refreshUserData, userData?.balance, isNewUser]);
  
  const resetBalance = useCallback(async (): Promise<void> => {
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('lastBalanceUpdateTime');
    localStorage.removeItem('highestBalance');
    localStorage.removeItem('balanceState');
    
    localBalanceRef.current = null;
    highestEverBalanceRef.current = null;
    
    balanceManager.resetBalance();
    
    await refreshUserData();
  }, [refreshUserData]);
  
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
