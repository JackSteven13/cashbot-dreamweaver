
import { useCallback } from 'react';
import balanceManager from '@/utils/balance/balanceManager';

interface UseBalanceUpdatesProps {
  dailySessionCount: number;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  incrementSessionCount: () => Promise<void>;
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useBalanceUpdates = ({
  dailySessionCount,
  updateBalance,
  incrementSessionCount,
  setShowLimitAlert
}: UseBalanceUpdatesProps) => {
  const handleBalanceUpdate = useCallback(async (gain: number) => {
    const currentGains = balanceManager.getDailyGains();
    
    if (currentGains >= 0.5) {
      setShowLimitAlert(true);
      return;
    }
    
    const sessionReport = `Session manuelle #${dailySessionCount + 1}: ${gain}€ générés.`;
    await incrementSessionCount();
    await updateBalance(gain, sessionReport, true);
  }, [dailySessionCount, updateBalance, incrementSessionCount, setShowLimitAlert]);

  return { handleBalanceUpdate };
};
