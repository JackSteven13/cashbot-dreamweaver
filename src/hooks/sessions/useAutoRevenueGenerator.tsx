
import { useRef } from 'react';
import { UserData } from '@/types/userData';
import { useBotStatus } from './useBotStatus';
import { useSessionOperations } from './useSessionOperations';

/**
 * Hook for generating automatic revenue
 */
export const useAutoRevenueGenerator = (
  userData: UserData,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  todaysGainsRef: React.MutableRefObject<number>,
  getDailyLimit: () => number
) => {
  // Use the extracted hooks
  const {
    isBotActive,
    updateBotStatus,
    resetBotActivity
  } = useBotStatus(true);
  
  const {
    generateAutomaticRevenue,
    isSessionInProgress
  } = useSessionOperations(
    userData,
    updateBalance,
    setShowLimitAlert,
    todaysGainsRef,
    getDailyLimit,
    isBotActive,
    updateBotStatus
  );

  return {
    generateAutomaticRevenue,
    isSessionInProgress,
    isBotActive,
    resetBotActivity
  };
};
