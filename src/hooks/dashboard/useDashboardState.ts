
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
  
  // Effet de debug pour compter les rendus
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`Dashboard render count: ${renderCountRef.current}`);
  });
  
  // Utiliser useMemo pour éviter les re-rendus inutiles
  const userData = useUserData();
  
  // Optimiser la vérification de dormance avec les données mémorisées
  const {
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate
  } = useDormancyCheck(userData.userData?.subscription || 'freemium', userData.refetchUserData);
  
  // Add safe default values for missing properties
  const dailySessionCount = 0;
  const showLimitAlert = false;
  const setShowLimitAlert = () => {}; // Noop function for safety

  // Memoize des sessions pour éviter les recalculs inutiles
  const sessions = useDashboardSessions(
    userData.userData || {},
    dailySessionCount,
    async () => { return true; }, // placeholder for incrementSessionCount returning Promise<boolean>
    async (gain, report, forceUpdate) => { return true; }, // placeholder for updateBalance returning Promise<boolean>
    setShowLimitAlert,
    async () => { return true; } // placeholder for resetBalance returning Promise<boolean>
  );

  // Memoize la fonction de rafraîchissement pour éviter les re-rendus
  const forceRefresh = useCallback(async () => {
    console.log("Forçage du rafraîchissement du dashboard");
    setRenderKey(Date.now());
    
    try {
      await userData.refetchUserData();
      return true; // Retourner true pour satisfaire le type Promise<boolean>
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return false; // Retourner false en cas d'erreur
    }
  }, [userData.refetchUserData]);

  // Extraire les propriétés de userData pour éviter les références qui changent
  const {
    userData: userDataObj,
    isLoading = false
  } = userData;

  // Use default values for potentially missing properties
  const isNewUser = false;

  // Extraire les propriétés de sessions pour éviter les références qui changent
  const {
    isStartingSession = false,
    handleStartSession = async () => { return true; },
    handleWithdrawal = async () => { return true; },
    lastSessionTimestamp,
    isBotActive = true
  } = sessions;

  // Retourner un objet mémorisé pour éviter les références changeantes
  return useMemo(() => ({
    selectedNavItem,
    setSelectedNavItem,
    renderKey,
    initialRenderComplete,
    userData: userDataObj,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate,
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    forceRefresh,
    isLoading,
    isBotActive
  }), [
    selectedNavItem,
    renderKey,
    userDataObj,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate,
    isStartingSession,
    handleStartSession, 
    handleWithdrawal,
    lastSessionTimestamp,
    forceRefresh,
    isLoading,
    isBotActive
  ]);
};
