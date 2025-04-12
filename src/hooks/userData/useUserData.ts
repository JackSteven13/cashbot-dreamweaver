
import { useState, useCallback } from 'react';
import { useUserDataState } from './useUserDataState';
import { useUserDataFetching } from './useUserDataFetching';
import { useProfileLoader } from '../useProfileLoader';
import { useBalanceLoader } from '../useBalanceLoader';
import { useReferralSystem } from '../useReferralSystem';
import { useDailyReset } from '../useDailyReset';

export const useUserData = () => {
  const userDataState = useUserDataState();
  const { 
    userData, isNewUser, dailySessionCount, showLimitAlert, 
    isLoading, isBotActive, dailyLimitProgress, 
    setUserData, setIsNewUser, setDailySessionCount, 
    setShowLimitAlert, setIsLoading, setIsBotActive, setDailyLimitProgress
  } = userDataState;
  
  const { loadUserProfile, isNewUser: profileIsNew } = useProfileLoader();
  const { loadUserBalance } = useBalanceLoader(setIsNewUser);
  const { referralLink, referrals } = useReferralSystem(userData?.profile?.id);

  const { fetchUserData, resetDailyCounters } = useUserDataFetching(
    loadUserProfile,
    loadUserBalance,
    (data) => {
      // Mise à jour avec typage correct
      if (data.userData) {
        setUserData(data.userData);
      }
      
      if ('isNewUser' in data) {
        setIsNewUser(!!data.isNewUser);
      }
      
      if ('dailySessionCount' in data) {
        setDailySessionCount(data.dailySessionCount as number);
      }
      
      if ('showLimitAlert' in data) {
        setShowLimitAlert(!!data.showLimitAlert);
      }
      
      if ('isLoading' in data) {
        setIsLoading(!!data.isLoading);
      }
      
      if ('dailyLimitProgress' in data) {
        setDailyLimitProgress(data.dailyLimitProgress as number);
      }
    },
    setIsLoading,
    isNewUser
  );

  // Fonction pour actualiser les données utilisateur
  const refreshUserData = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  // Utiliser useDailyReset pour réinitialiser les compteurs à minuit
  useDailyReset(resetDailyCounters, isLoading);

  // Combiner les données et actions pour returner un objet complet
  return {
    userData: userData ? {
      ...userData,
      referralLink: referralLink || userData.referralLink,
      referrals: referrals || userData.referrals || []
    } : null,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    isBotActive,
    dailyLimitProgress,
    userActions: {
      setShowLimitAlert,
      incrementSessionCount: async () => {
        setDailySessionCount(prev => prev + 1);
        return dailySessionCount + 1;
      },
      updateBalance: async (gain: number, report: string, forceUpdate = false) => {
        if (userData) {
          const newBalance = userData.balance + gain;
          setUserData({ 
            ...userData, 
            balance: newBalance 
          });
          // Forcer une mise à jour des transactions
          if (forceUpdate) {
            setTimeout(() => fetchUserData(), 1500);
          }
          return newBalance;
        }
        return 0;
      },
      resetBalance: async () => {
        if (userData) {
          setUserData({ 
            ...userData, 
            balance: 0 
          });
          await fetchUserData();
          return true;
        }
        return false;
      },
      resetDailyCounters
    },
    generateAutomaticRevenue: async (forceUpdate = false) => {
      // Implémenter si nécessaire
      return true;
    },
    refreshUserData,
    setShowLimitAlert,
    incrementSessionCount: async () => {
      setDailySessionCount(prev => prev + 1);
      return dailySessionCount + 1;
    },
    updateBalance: async (gain: number, report: string, forceUpdate = false) => {
      if (userData) {
        const newBalance = userData.balance + gain;
        setUserData({ 
          ...userData, 
          balance: newBalance 
        });
        // Forcer une mise à jour des transactions
        if (forceUpdate) {
          setTimeout(() => fetchUserData(), 1500);
        }
        return newBalance;
      }
      return 0;
    },
    resetBalance: async () => {
      if (userData) {
        setUserData({ 
          ...userData, 
          balance: 0 
        });
        await fetchUserData();
        return true;
      }
      return false;
    },
    resetDailyCounters
  };
};

export default useUserData;
