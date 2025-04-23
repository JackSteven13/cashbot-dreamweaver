
import { useState } from 'react';
import { useBoostSession } from './dashboard/sessions/useBoostSession';
import { useBalanceUpdates } from './dashboard/sessions/useBalanceUpdates';
import { useSessionIncrement } from './dashboard/sessions/useSessionIncrement';
import { useWithdrawal } from './dashboard/sessions/useWithdrawal';

interface UseBalanceActionsProps {
  userData: any;
  dailySessionCount: number;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
  setDailySessionCount: React.Dispatch<React.SetStateAction<number>>;
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useBalanceActions = ({
  userData,
  dailySessionCount,
  setUserData,
  setDailySessionCount,
  setShowLimitAlert
}: UseBalanceActionsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const incrementSessionCount = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      setDailySessionCount(prev => prev + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBalance = async (gain: number, report: string, forceUpdate: boolean = false) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      setUserData(prev => ({
        ...prev,
        balance: prev.balance + gain
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetBalance = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      setUserData(prev => ({ ...prev, balance: 0 }));
    } finally {
      setIsProcessing(false);
    }
  };

  const { handleBoostSession } = useBoostSession({
    userData,
    updateBalance,
    incrementSessionCount,
    setShowLimitAlert
  });

  const { handleBalanceUpdate } = useBalanceUpdates({
    dailySessionCount,
    updateBalance,
    incrementSessionCount,
    setShowLimitAlert
  });

  const { handleIncrementSession } = useSessionIncrement({
    incrementSessionCount
  });

  const { handleWithdrawal } = useWithdrawal({
    userData,
    resetBalance
  });

  return {
    incrementSessionCount: handleIncrementSession,
    updateBalance: handleBalanceUpdate,
    handleBoostSession,
    handleWithdrawal,
    resetBalance
  };
};
