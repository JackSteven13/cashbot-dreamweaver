
import { UserData } from '@/types/userData';
import { useAutoSessions } from './sessions/useAutoSessions';
import { useManualSessions } from './sessions/useManualSessions';
import { useWithdrawal } from './sessions/useWithdrawal';
import { useMidnightReset } from './sessions/useMidnightReset';

export const useDashboardSessions = (
  userData: UserData,
  dailySessionCount: number,
  incrementSessionCount: () => Promise<void>,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  resetBalance: () => Promise<void>
) => {
  // Use the individual hooks for each functionality
  useAutoSessions(
    userData,
    updateBalance,
    setShowLimitAlert
  );

  const { isStartingSession, handleStartSession } = useManualSessions({
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert
  });

  const { handleWithdrawal, isProcessingWithdrawal } = useWithdrawal(
    userData,
    resetBalance
  );

  // Set up midnight reset
  useMidnightReset(
    userData,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert
  );

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    isProcessingWithdrawal
  };
};

export default useDashboardSessions;
