
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserDataFetcher } from '../useUserDataFetcher';
import { UserData } from '@/types/userData';
import balanceManager, { getHighestBalance } from '@/utils/balance/balanceManager';
import { supabase } from "@/integrations/supabase/client";

export const useUserData = () => {
  const [userDataFetcher, userDataActions] = useUserDataFetcher();
  const { userData, isNewUser, dailySessionCount, showLimitAlert, isLoading, isBotActive, dailyLimitProgress } = userDataFetcher;
  const balanceSyncRef = useRef(false);
  const localBalanceRef = useRef<number | null>(null);
  const highestEverBalanceRef = useRef<number | null>(null);
  const fetchAttemptsRef = useRef(0);
  
  // États locaux pour le correctif
  const [localUserData, setLocalUserData] = useState<UserData | null>(userData);
  const [localIsNewUser, setLocalIsNewUser] = useState<boolean>(isNewUser);
  const [localDailySessionCount, setLocalDailySessionCount] = useState<number>(dailySessionCount);
  const [localShowLimitAlert, setLocalShowLimitAlert] = useState<boolean>(showLimitAlert);
  const [localIsBotActive, setLocalIsBotActive] = useState<boolean>(isBotActive);
  const [localDailyLimitProgress, setLocalDailyLimitProgress] = useState<number>(dailyLimitProgress);
  
  // Mettre à jour les états locaux quand les données changent
  useEffect(() => {
    setLocalUserData(userData);
    setLocalIsNewUser(isNewUser);
    setLocalDailySessionCount(dailySessionCount);
    setLocalShowLimitAlert(showLimitAlert);
    setLocalIsBotActive(isBotActive);
    setLocalDailyLimitProgress(dailyLimitProgress);
  }, [userData, isNewUser, dailySessionCount, showLimitAlert, isBotActive, dailyLimitProgress]);
  
  // Effet de chargement initial avec tentatives de récupération multiples
  useEffect(() => {
    const fetchData = async () => {
      await userDataActions.fetchUserData();
      
      // Si les données sont manquantes après la première tentative, réessayer
      if (!userData || !userData.profile || !userData.profile.full_name) {
        if (fetchAttemptsRef.current < 3) {
          fetchAttemptsRef.current++;
          console.log(`Tentative ${fetchAttemptsRef.current} de récupération des données utilisateur...`);
          
          setTimeout(() => {
            userDataActions.fetchUserData();
          }, 1000 * fetchAttemptsRef.current); // Délai croissant entre les tentatives
        }
      } else {
        console.log("Données utilisateur récupérées avec succès:", userData.profile.full_name);
      }
    };
    
    fetchData();
  }, []);
  
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
        if (maxBalance > apiBalance && apiBalance >= 0) {
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
          
          // Synchroniser également avec la base de données si le solde local est plus élevé
          if (userData.profile && userData.profile.id && maxBalance > apiBalance) {
            supabase
              .from('user_balances')
              .update({ balance: maxBalance })
              .eq('id', userData.profile.id)
              .then(({ error }) => {
                if (error) {
                  console.error("Erreur lors de la synchronisation du solde avec la BD:", error);
                } else {
                  console.log("Solde synchronisé avec la base de données:", maxBalance);
                }
              });
          }
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
      if (highestBalance > currentDb && currentDb >= 0) {
        console.log(`[useUserData] Balance inconsistency: local=${highestBalance}, db=${currentDb}. Forcing sync...`);
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: highestBalance }
        }));
        
        // Synchroniser avec la BD
        if (userData?.profile?.id) {
          supabase
            .from('user_balances')
            .update({ balance: highestBalance })
            .eq('id', userData.profile.id)
            .then(({ error }) => {
              if (error) {
                console.error("Erreur lors de la synchronisation du solde avec la BD:", error);
              } else {
                console.log("Solde synchronisé avec la base de données:", highestBalance);
              }
            });
        }
      }
    }, 60000);
    
    return () => clearInterval(checkInterval);
  }, [userData?.profile?.id]);
  
  // Quand userData change, mettre à jour nos références locales si nécessaire
  useEffect(() => {
    if (userData?.balance !== undefined && userData.balance >= 0) {
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
    }
  }, [userData?.balance]);
  
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    // Si les données sont manquantes après la première tentative, réessayer
    fetchAttemptsRef.current = 0;
    console.log("Forçage de l'actualisation des données utilisateur");
    
    try {
      await userDataActions.fetchUserData();
      return true; // Return true on successful data fetch
    } catch (error) {
      console.error("Erreur lors de l'actualisation des données:", error);
      return false; // Return false on error
    }
  }, [userDataActions]);
  
  const incrementSessionCount = useCallback(async (): Promise<number> => {
    await refreshUserData();
    setLocalDailySessionCount(prev => prev + 1);
    return localDailySessionCount + 1;
  }, [refreshUserData, localDailySessionCount]);
  
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate: boolean = false): Promise<number> => {
    if (localIsNewUser) {
      console.log("Tentative de mise à jour du solde pour un nouvel utilisateur - forcé à 0");
      return 0;
    }
    
    const positiveGain = Math.max(0, gain);
    
    if (localUserData?.balance !== undefined) {
      // Obtenir le solde le plus à jour possible
      const highestBalance = getHighestBalance();
      const currentBalance = Math.max(
        localBalanceRef.current || 0,
        highestBalance || 0,
        localUserData.balance
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
      
      // Mettre à jour l'état local
      setLocalUserData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          balance: newBalance
        };
      });
      
      console.log(`[useUserData] Balance updated locally: ${currentBalance} + ${positiveGain} = ${newBalance}`);
      
      // Forcer la mise à jour de l'UI si demandé
      if (forceUpdate) {
        window.dispatchEvent(new CustomEvent('balance:force-update', { 
          detail: { newBalance: newBalance }
        }));
      }
      
      await refreshUserData();
      return newBalance;
    }
    
    await refreshUserData();
    return 0;
  }, [refreshUserData, localUserData?.balance, localIsNewUser]);
  
  const resetBalance = useCallback(async (): Promise<boolean> => {
    // Effacer toutes les références au solde
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('lastBalanceUpdateTime');
    localStorage.removeItem('highestBalance');
    localStorage.removeItem('balanceState');
    
    localBalanceRef.current = null;
    highestEverBalanceRef.current = null;
    
    // Mettre à jour l'état local
    setLocalUserData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        balance: 0
      };
    });
    
    // Réinitialiser le gestionnaire central
    balanceManager.resetBalance();
    
    // Forcer une mise à jour complète depuis la BD
    await refreshUserData();
    return true;
  }, [refreshUserData]);
  
  // Toujours utiliser le solde le plus élevé pour l'affichage
  const effectiveBalance = localIsNewUser ? 
    0 : 
    Math.max(
      localBalanceRef.current || 0,
      getHighestBalance() || 0,
      localUserData?.balance || 0
    );
  
  return {
    userData: localUserData ? {
      ...localUserData,
      balance: effectiveBalance
    } : null,
    isNewUser: localIsNewUser,
    dailySessionCount: localDailySessionCount,
    showLimitAlert: localShowLimitAlert,
    isLoading,
    isBotActive: localIsBotActive,
    dailyLimitProgress: localDailyLimitProgress,
    userActions: {
      setShowLimitAlert: userDataActions.setShowLimitAlert,
      incrementSessionCount,
      updateBalance,
      resetBalance,
      resetDailyCounters: userDataActions.resetDailyCounters
    },
    setShowLimitAlert: (show: boolean) => {
      setLocalShowLimitAlert(show);
      userDataActions.setShowLimitAlert(show);
    },
    refreshUserData,
    incrementSessionCount,
    updateBalance,
    resetBalance,
    resetDailyCounters: userDataActions.resetDailyCounters,
    generateAutomaticRevenue: async () => {}
  };
};
