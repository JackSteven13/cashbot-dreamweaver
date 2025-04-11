
import { useState, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { useUserDataFetching } from './useUserDataFetching';
import { useProfileLoader } from '../useProfileLoader';
import { useBalanceLoader } from '../useBalanceLoader';
import { useDailyReset } from '../useDailyReset';
import { useAutomaticRevenue } from './useAutomaticRevenue';

export interface UserFetcherState {
  userData: UserData | null;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isLoading: boolean;
}

export const useUserDataState = () => {
  // États de base pour les données utilisateur
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [dailySessionCount, setDailySessionCount] = useState(0);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hooks pour charger et gérer les données
  const { loadUserProfile } = useProfileLoader();
  const { loadUserBalance } = useBalanceLoader(setIsNewUser);
  
  // Fonction pour mettre à jour les données utilisateur
  const updateUserData = useCallback((newData: UserData | null): void => {
    if (newData) {
      setUserData(newData);
      
      // Mise à jour du compteur de sessions quotidiennes
      if (typeof newData?.dailySessionCount === 'number') {
        setDailySessionCount(newData.dailySessionCount);
      }
    }
  }, []);
  
  // Utiliser les hooks de récupération de données
  const { fetchUserData, resetDailyCounters } = useUserDataFetching(
    loadUserProfile,
    loadUserBalance,
    updateUserData,
    setIsLoading,
    isNewUser
  );
  
  // Utiliser le hook de réinitialisation quotidienne
  useDailyReset(resetDailyCounters, isLoading);
  
  // Fonction pour mettre à jour le solde utilisateur
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate: boolean = false): Promise<void> => {
    if (isNewUser) {
      console.log("Tentative de mise à jour du solde pour un nouvel utilisateur - forcé à 0");
      return;
    }
    
    if (userData) {
      // Mettre à jour la balance locale
      setUserData(prevData => {
        if (!prevData) return null;
        
        const newBalance = (prevData.balance || 0) + gain;
        
        return {
          ...prevData,
          balance: newBalance
        };
      });
      
      // Forcer une mise à jour UI si demandé
      if (forceUpdate) {
        window.dispatchEvent(new CustomEvent('balance:force-update', { 
          detail: { gain, newBalance: userData.balance + gain }
        }));
      }
    }
    
    // Rafraîchir les données pour rester synchronisé avec le back-end
    await fetchUserData();
  }, [fetchUserData, userData, isNewUser]);
  
  // Reset du solde complet
  const resetBalance = useCallback(async (): Promise<void> => {
    // Réinitialiser au niveau local
    setUserData(prevData => {
      if (!prevData) return null;
      
      return {
        ...prevData,
        balance: 0
      };
    });
    
    // Notifier les composants UI de la réinitialisation
    window.dispatchEvent(new CustomEvent('balance:reset-complete'));
    
    // Rafraîchir les données depuis l'API
    await fetchUserData();
  }, [fetchUserData]);
  
  // Utiliser notre nouveau hook pour les revenus automatiques
  const { isBotActive, dailyLimitProgress, generateAutomaticRevenue } = 
    useAutomaticRevenue(userData, updateBalance, isNewUser);
  
  const userActions = {
    setShowLimitAlert,
    resetDailyCounters,
    updateBalance,
    resetBalance,
  };
  
  return {
    // État
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    isBotActive,
    dailyLimitProgress,
    
    // Actions
    userActions,
    refreshUserData: fetchUserData,
    generateAutomaticRevenue
  };
};
