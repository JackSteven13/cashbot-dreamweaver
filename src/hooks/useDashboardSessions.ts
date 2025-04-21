import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { resetUserBalance } from '@/utils/balance/resetBalance';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { canStartManualSession, SessionStartResult, SessionCheckResult } from '@/utils/subscription/sessionManagement';
import { calculateManualSessionGain } from '@/utils/subscription/sessionGain';
import { simulateActivity } from '@/utils/animations/moneyParticles';
import balanceManager from '@/utils/balance/balanceManager';
import { useSessionStarter } from './dashboard/sessions/useSessionStarter';
import { useWithdrawal } from './dashboard/sessions/useWithdrawal';
import { useBotStatus } from './dashboard/sessions/useBotStatus';

interface UseDashboardSessionsProps {
  userData: any;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>;
  resetBalance: () => Promise<void>;
}

interface UseDashboardSessionsResult {
  isStartingSession: boolean;
  handleStartSession: () => Promise<void>;
  handleWithdrawal: () => Promise<void>;
  lastSessionTimestamp: number | null;
  isBotActive: boolean;
  toggleBotActive?: () => void;
}

export const useDashboardSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert,
  resetBalance
}: UseDashboardSessionsProps): UseDashboardSessionsResult => {
  const {
    isStartingSession,
    handleStartSession,
    lastSessionTimestamp
  } = useSessionStarter({
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert
  });

  const { handleWithdrawal } = useWithdrawal({
    userData,
    resetBalance
  });

  const { isBotActive } = useBotStatus();

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    isBotActive
  };
};

export default useDashboardSessions;
