import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserDataFetcher } from './useUserDataFetcher';
import { UserData } from '@/types/userData';

export const useUserData = () => {
  const [userDataFetcher, userDataActions] = useUserDataFetcher();
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading } = userDataFetcher;
  const balanceSyncRef = useRef(false);
  const localBalanceRef = useRef<number | null>(null);
  const highestEverBalanceRef = useRef<number | null>(null);
  
  useEffect(() => {
    userDataActions.fetchUserData().then(() => {
      if (userData) {
        if (isNewUser) {
          console.log("Nouveau utilisateur détecté - Initialisation du state à zéro");
          localStorage.removeItem('highestBalance');
          localStorage.removeItem('currentBalance');
          localStorage.removeItem('lastKnownBalance');
          localStorage.removeItem('lastBalanceUpdateTime');
          
          localBalanceRef.current = 0;
          highestEverBalanceRef.current = 0;
          
          window.dispatchEvent(new CustomEvent('balance:force-sync', { 
            detail: { balance: 0 }
          }));
          
          return;
        }
        
        const storedHighestBalance = localStorage.getItem('highestBalance');
        const storedBalance = localStorage.getItem('currentBalance');
        const storedLastKnownBalance = localStorage.getItem('lastKnownBalance');
        
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
        
        if (maxBalance > userData.balance) {
          console.log(`Restoring balance from localStorage: ${maxBalance} (server balance: ${userData.balance})`);
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
        
        const maxBalance = highestEverBalanceRef.current || localBalanceRef.current || (userData?.balance ?? 0);
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: maxBalance }
        }));
      }
    }, 60000);
    
    return () => clearInterval(checkInterval);
  }, []);
  
  useEffect(() => {
    if (userData?.balance !== undefined) {
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('currentBalance');
      const storedLastKnownBalance = localStorage.getItem('lastKnownBalance');
      
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
      
      localBalanceRef.current = maxCurrentBalance;
      
      if (highestEverBalanceRef.current === null || maxCurrentBalance > highestEverBalanceRef.current) {
        highestEverBalanceRef.current = maxCurrentBalance;
      }
      
      localStorage.setItem('highestBalance', highestEverBalanceRef.current.toString());
      localStorage.setItem('currentBalance', maxCurrentBalance.toString());
      localStorage.setItem('lastKnownBalance', maxCurrentBalance.toString());
      
      if (Math.abs((userData.balance || 0) - maxCurrentBalance) > 0.01) {
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: maxCurrentBalance }
        }));
      }
      
      console.log(`[useUserData] Current max balance: ${maxCurrentBalance}, API balance: ${userData.balance}`);
    }
  }, [userData?.balance]);
  
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
      const currentMaxBalance = localBalanceRef.current !== null ? 
        localBalanceRef.current : userData.balance;
      
      const newBalance = currentMaxBalance + positiveGain;
      
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      
      if (highestEverBalanceRef.current === null || newBalance > highestEverBalanceRef.current) {
        highestEverBalanceRef.current = newBalance;
        localStorage.setItem('highestBalance', newBalance.toString());
      }
      
      localBalanceRef.current = newBalance;
      
      console.log(`Balance updated locally: ${currentMaxBalance} + ${positiveGain} = ${newBalance}`);
      
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
    
    localBalanceRef.current = null;
    highestEverBalanceRef.current = null;
    
    await refreshUserData();
  }, [refreshUserData]);
  
  const effectiveBalance = isNewUser ? 
    0 : 
    (localBalanceRef.current !== null ? localBalanceRef.current : (userData?.balance || 0));
  
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
