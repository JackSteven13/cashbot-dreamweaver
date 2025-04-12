
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserData } from '@/hooks/userData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { useDormancyCheck } from '@/hooks/useDormancyCheck';

/**
 * Hook pour gérer l'état global du dashboard
 */
export const useDashboardState = () => {
  // Compteur pour forcer les re-rendus
  const [renderKey, setRenderKey] = useState(0);
  
  // État de navigation
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  
  // Utiliser les hooks de données utilisateur
  const {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue,
    setShowLimitAlert: setShowLimit,
    refreshUserData,
    incrementSessionCount,
    updateBalance,
    resetBalance,
    resetDailyCounters
  } = useUserData();
  
  // Vérification de la dormance du compte
  const { isDormant, isChecking, dormancyData, handleReactivate } = 
    useDormancyCheck(userData, showLimitAlert);
  
  // Gestion des sessions - Update parameters to match what useDashboardSessions expects
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    localBalance,
    isBotActive: sessionBotActive
  } = useDashboardSessions({
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert: setShowLimit,
    resetBalance
  });
  
  // Force refresh pour les erreurs
  const forceRefresh = useCallback(() => {
    refreshUserData();
    setRenderKey(prev => prev + 1);
  }, [refreshUserData]);
  
  // Démarrer la génération automatique si possible
  useEffect(() => {
    // Vérifier si l'utilisateur peut bénéficier de revenus automatiques
    if (userData && !isNewUser && !isDormant && isBotActive && !isChecking) {
      // Initier la première génération automatique après un court délai
      const startTimer = setTimeout(() => {
        generateAutomaticRevenue(true);
      }, 15000);
      
      return () => clearTimeout(startTimer);
    }
  }, [userData, isNewUser, isDormant, isBotActive, isChecking, generateAutomaticRevenue]);
  
  return {
    selectedNavItem,
    setSelectedNavItem,
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
    isLoading,
    isBotActive: sessionBotActive || isBotActive,
    dailyLimitProgress
  };
};

export default useDashboardState;
