
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { useDormancyCheck } from '@/hooks/useDormancyCheck';

export const useDashboardState = () => {
  // Utiliser useRef pour les données qui ne devraient pas déclencher de re-rendu
  const renderCountRef = useRef(0);
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [renderKey, setRenderKey] = useState(Date.now());
  const initialRenderComplete = useRef(false);
  const dataInitialized = useRef(false);
  
  // Effet de debug pour compter les rendus
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`Dashboard render count: ${renderCountRef.current}`);
  });
  
  // Utiliser useMemo pour éviter les re-rendus inutiles
  const userData = useUserData();
  
  // Protection contre les valeurs manquantes avec des valeurs par défaut explicites
  const userDataWithDefaults = useMemo(() => {
    // Valeurs par défaut complètes
    const defaultState = {
      userData: {
        username: 'utilisateur',
        balance: 0,
        subscription: 'freemium',
        transactions: [],
        referrals: [],
        referralLink: ''
      },
      isNewUser: false,
      dailySessionCount: 0,
      showLimitAlert: false,
      setShowLimitAlert: () => {},
      isLoading: false,
      refreshUserData: async () => false,
      updateBalance: async () => {},
      resetBalance: async () => {},
      incrementSessionCount: async () => {}
    };
    
    // Utiliser les valeurs existantes ou les valeurs par défaut
    const result = {
      userData: userData.userData || defaultState.userData,
      isNewUser: userData.isNewUser || defaultState.isNewUser,
      dailySessionCount: userData.dailySessionCount || defaultState.dailySessionCount,
      showLimitAlert: userData.showLimitAlert || defaultState.showLimitAlert,
      setShowLimitAlert: userData.setShowLimitAlert || defaultState.setShowLimitAlert,
      isLoading: userData.isLoading === undefined ? defaultState.isLoading : userData.isLoading,
      refreshUserData: userData.refreshUserData || defaultState.refreshUserData,
      updateBalance: userData.updateBalance || defaultState.updateBalance,
      resetBalance: userData.resetBalance || defaultState.resetBalance,
      incrementSessionCount: userData.incrementSessionCount || defaultState.incrementSessionCount
    };
    
    // Marquer comme initialisé dès qu'on a un nom d'utilisateur
    if (userData.userData && userData.userData.username) {
      dataInitialized.current = true;
    }
    
    return result;
  }, [userData]);
  
  // Optimiser la vérification de dormance avec les données mémorisées
  const {
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate
  } = useDormancyCheck(
    userDataWithDefaults.userData.subscription || 'freemium',
    userDataWithDefaults.refreshUserData
  );
  
  // Memoize des sessions pour éviter les recalculs inutiles
  const sessions = useDashboardSessions(
    userDataWithDefaults.userData,
    userDataWithDefaults.dailySessionCount,
    userDataWithDefaults.incrementSessionCount,
    userDataWithDefaults.updateBalance,
    userDataWithDefaults.setShowLimitAlert,
    userDataWithDefaults.resetBalance
  );

  // Memoize la fonction de rafraîchissement pour éviter les re-rendus
  const forceRefresh = useCallback(() => {
    console.log("Forçage du rafraîchissement du dashboard");
    setRenderKey(Date.now());
    userDataWithDefaults.refreshUserData().catch(error => console.error("Error refreshing user data:", error));
  }, [userDataWithDefaults.refreshUserData]);

  // Extraire les propriétés de sessions pour éviter les références qui changent
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    localBalance
  } = sessions;

  // Retourner un objet mémorisé pour éviter les références changeantes
  return useMemo(() => ({
    selectedNavItem,
    setSelectedNavItem,
    renderKey,
    initialRenderComplete,
    userData: userDataWithDefaults.userData,
    isNewUser: userDataWithDefaults.isNewUser,
    dailySessionCount: userDataWithDefaults.dailySessionCount,
    showLimitAlert: userDataWithDefaults.showLimitAlert,
    setShowLimitAlert: userDataWithDefaults.setShowLimitAlert,
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate,
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    forceRefresh,
    isLoading: false, // Forcer isLoading à false pour afficher le tableau de bord immédiatement
    localBalance
  }), [
    selectedNavItem,
    renderKey,
    userDataWithDefaults.userData,
    userDataWithDefaults.isNewUser,
    userDataWithDefaults.dailySessionCount,
    userDataWithDefaults.showLimitAlert,
    isDormant,
    dormancyData, 
    isChecking,
    handleReactivate,
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    forceRefresh,
    userDataWithDefaults.setShowLimitAlert,
    localBalance
  ]);
};
