
import { useState } from 'react';
import { UserData } from '@/types/userData';
import { useActivitySimulation } from './useActivitySimulation';
import { useDailyLimits } from './useDailyLimits';
import { useAutoRevenueGenerator } from './useAutoRevenueGenerator';
import { useAutoSessionScheduler } from './useAutoSessionScheduler';

export const useAutoSessions = (
  userData: UserData,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState(Date.now());
  
  // Use focused hooks for different aspects of auto-sessions
  const { activityLevel } = useActivitySimulation();
  const { todaysGainsRef, getDailyLimit } = useDailyLimits(userData);
  
  // Create auto revenue generator
  const { generateAutomaticRevenue, isSessionInProgress, isBotActive, resetBotActivity } = useAutoRevenueGenerator(
    userData,
    updateBalance,
    setShowLimitAlert,
    todaysGainsRef,
    getDailyLimit
  );
  
  // Schedule auto sessions
  const { setLastAutoSessionTime: updateLastSessionTime } = useAutoSessionScheduler(
    todaysGainsRef,
    generateAutomaticRevenue,
    userData,
    isBotActive
  );
  
  // Update the lastAutoSessionTime state both locally and in the scheduler
  const setSessionTime = (time: number) => {
    setLastAutoSessionTime(time);
    updateLastSessionTime(time);
  };

  return {
    lastAutoSessionTime,
    setLastAutoSessionTime: setSessionTime,
    activityLevel,
    generateAutomaticRevenue,
    isBotActive,
    resetBotActivity
  };
};
