
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
  
  // Protection contre les valeurs manquantes
  const userDataWithDefaults = useMemo(() => {
    // Si les données n'ont pas changé et qu'on a déjà initialisé, ne pas refaire l'opération
    if (dataInitialized.current && userData && userData.userData && userData.userData.username) {
      return userData;
    }
    
    const defaultData = {
      userData: userData.userData || {
        username: 'utilisateur',
        balance: 0,
        subscription: 'freemium',
        transactions: [],
        referrals: [],
        referralLink: ''
      },
      isNewUser: userData.isNewUser || false,
      dailySessionCount: userData.dailySessionCount || 0,
      showLimitAlert: userData.showLimitAlert || false,
      setShowLimitAlert: userData.setShowLimitAlert || (() => {}),
      isLoading: userData.isLoading === undefined ? false : userData.isLoading,
      refreshUserData: userData.refreshUserData || (async () => false),
      updateBalance: userData.updateBalance || (async () => {}),
      resetBalance: userData.resetBalance || (async () => {}),
      incrementSessionCount: userData.incrementSessionCount || (async () => {})
    };
    
    // Marquer comme initialisé si on a un nom d'utilisateur
    if (userData.userData && userData.userData.username) {
      dataInitialized.current = true;
    }
    
    return defaultData;
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
    isLoading: userDataWithDefaults.isLoading,
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
    userDataWithDefaults.isLoading,
    userDataWithDefaults.setShowLimitAlert,
    localBalance
  ]);
};
