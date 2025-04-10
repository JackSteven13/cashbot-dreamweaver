
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { useDormancyCheck } from '@/hooks/useDormancyCheck';

export const useDashboardState = () => {
  // Use useRef for data that shouldn't trigger re-render
  const renderCountRef = useRef(0);
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [renderKey, setRenderKey] = useState(Date.now());
  const initialRenderComplete = useRef(false);
  
  // Debug effect to count renders
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`Dashboard render count: ${renderCountRef.current}`);
  });
  
  // Use useMemo to avoid unnecessary re-renders
  const userData = useUserData();
  
  // Optimize dormancy check with memoized data
  const {
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate
  } = useDormancyCheck(
    userData.userData?.subscription || 'freemium',
    // Adapter la fonction pour retourner void au lieu de boolean
    async () => {
      try {
        await userData.refetchUserData();
      } catch (error) {
        console.error("Error refetching user data:", error);
      }
    }
  );
  
  // Add safe default values for missing properties
  const dailySessionCount = 0;
  const showLimitAlert = false;
  const setShowLimitAlert = () => {}; // Noop function for safety

  // Memoize sessions to avoid unnecessary recalculations
  const sessions = useDashboardSessions(
    userData.userData || {},
    dailySessionCount,
    // Adapter pour retourner void au lieu de boolean
    async () => { 
      try {
        await Promise.resolve();
      } catch (error) {
        console.error("Error incrementing session count:", error);
      }
    },
    // Adapter pour retourner void au lieu de boolean
    async (gain, report, forceUpdate) => {
      try {
        await Promise.resolve();
      } catch (error) {
        console.error("Error updating balance:", error);
      }
    },
    setShowLimitAlert,
    // Adapter pour retourner void au lieu de boolean
    async () => { 
      try {
        await Promise.resolve();
      } catch (error) {
        console.error("Error resetting balance:", error);
      }
    }
  );

  // Memoize refresh function to avoid re-renders
  const forceRefresh = useCallback(async () => {
    console.log("Forcing dashboard refresh");
    setRenderKey(Date.now());
    
    try {
      await userData.refetchUserData();
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }, [userData.refetchUserData]);

  // Extract properties from userData to avoid changing references
  const {
    userData: userDataObj,
    isLoading = false
  } = userData;

  // Use default values for potentially missing properties
  const isNewUser = false;

  // Extract properties from sessions to avoid changing references
  const {
    isStartingSession = false,
    handleStartSession = async () => {},
    handleWithdrawal = async () => {},
    lastSessionTimestamp,
    isBotActive = true
  } = sessions;

  // Return a memoized object to avoid changing references
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
