
import { useState, useCallback, useRef } from 'react';
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
  const [userData, setUserData] = useState<UserData | null>(() => {
    // Tenter de récupérer des données en cache pour une apparence immédiate
    const cachedName = localStorage.getItem('lastKnownUsername');
    const cachedSubscription = localStorage.getItem('subscription');
    
    if (cachedName) {
      const initialData: UserData = {
        username: cachedName,
        subscription: cachedSubscription || 'freemium',
        balance: 0,
        referrals: [],
        referralLink: '',
        transactions: [],
        profile: {
          full_name: cachedName,
          id: 'loading',
          created_at: new Date().toISOString() // Convertir en string pour respecter le type
        }
      };
      return initialData;
    }
    
    return null;
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [dailySessionCount, setDailySessionCount] = useState(0);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dataUpdated = useRef(false);
  
  // Hooks pour charger et gérer les données
  const { loadUserProfile } = useProfileLoader();
  const { loadUserBalance } = useBalanceLoader(setIsNewUser);
  
  // Fonction pour mettre à jour les données utilisateur
  const updateUserData = useCallback((newData: UserData | null): void => {
    if (newData) {
      dataUpdated.current = true;
      setUserData(prevData => {
        // Fusionner avec les données précédentes pour éviter les flashs visuels
        // lors des mises à jour partielles
        return {
          ...prevData,
          ...newData,
          profile: {
            ...(prevData?.profile || {}),
            ...(newData.profile || {})
          }
        };
      });
      
      // Mise à jour du compteur de sessions quotidiennes
      if (typeof newData?.dailySessionCount === 'number') {
        setDailySessionCount(newData.dailySessionCount);
      }
      
      // Mettre à jour le cache pour accélérer les chargements futurs
      if (newData.profile?.full_name && newData.profile.full_name !== 'Utilisateur') {
        localStorage.setItem('lastKnownUsername', newData.profile.full_name);
      }
      if (newData.subscription) {
        localStorage.setItem('subscription', newData.subscription);
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
          detail: { gain, newBalance: (userData.balance || 0) + gain }
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
    isLoading: isLoading && !dataUpdated.current, // Ne pas montrer le chargement si on a déjà des données
    isBotActive,
    dailyLimitProgress,
    
    // Actions
    userActions,
    updateUserData,
    setIsLoading,
    refreshUserData: fetchUserData,
    generateAutomaticRevenue
  };
};
