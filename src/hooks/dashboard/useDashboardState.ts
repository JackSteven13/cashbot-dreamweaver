
import { useState, useCallback, useRef, useMemo } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { useDormancyCheck } from '@/hooks/useDormancyCheck';

export const useDashboardState = () => {
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [renderKey, setRenderKey] = useState(Date.now());
  const initialRenderComplete = useRef(false);
  
  // Utiliser useMemo pour éviter les re-rendus inutiles
  const {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading,
    refreshUserData
  } = useUserData();
  
  // Optimiser la vérification de dormance
  const {
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate
  } = useDormancyCheck(userData?.subscription || 'freemium', refreshUserData);
  
  // Memoize des sessions pour éviter les recalculs inutiles
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp
  } = useDashboardSessions(
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert,
    resetBalance
  );

  // Memoize la fonction de rafraîchissement pour éviter les re-rendus
  const forceRefresh = useCallback(() => {
    console.log("Forçage du rafraîchissement du dashboard");
    setRenderKey(Date.now());
    refreshUserData().catch(error => console.error("Error refreshing user data:", error));
  }, [refreshUserData]);

  // Retourner un objet mémorisé pour éviter les références changeantes
  return useMemo(() => ({
    selectedNavItem,
    setSelectedNavItem,
    renderKey,
    initialRenderComplete,
    userData,
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
    isLoading
  }), [
    selectedNavItem,
    renderKey,
    userData,
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
    isLoading
  ]);
};
