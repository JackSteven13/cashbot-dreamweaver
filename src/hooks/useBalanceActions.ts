
import { UserData } from "@/types/userData";
import { useUserSession } from './useUserSession';

interface BalanceActionsResult {
  updateBalance: (gain: number, report: string) => Promise<void>;
  resetBalance: () => Promise<void>;
  incrementSessionCount: () => Promise<void>;
}

interface UseBalanceActionsProps {
  userData: UserData;
  dailySessionCount: number;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  setDailySessionCount: React.Dispatch<React.SetStateAction<number>>;
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useBalanceActions = ({
  userData,
  dailySessionCount,
  setUserData,
  setDailySessionCount,
  setShowLimitAlert
}: UseBalanceActionsProps): BalanceActionsResult => {
  const { 
    incrementSessionCount: incrementSession, 
    updateBalance: updateUserBalance, 
    resetBalance: resetUserBalance 
  } = useUserSession();

  const incrementSessionCount = async () => {
    const newCount = await incrementSession(dailySessionCount);
    if (typeof newCount === 'number') {
      setDailySessionCount(newCount);
    }
  };

  const updateBalance = async (gain: number, report: string) => {
    const result = await updateUserBalance(gain, report);
    
    if (result.success) {
      setUserData(prev => ({
        ...prev,
        balance: result.newBalance || prev.balance,
        transactions: 'transaction' in result ? [
          result.transaction,
          ...prev.transactions
        ] : prev.transactions
      }));
      
      if (result.limitReached) {
        setShowLimitAlert(true);
      }
    }
  };

  const resetBalance = async () => {
    const result = await resetUserBalance();
    
    if (result.success) {
      setUserData(prev => ({
        ...prev,
        balance: 0,
        transactions: 'transaction' in result ? [
          result.transaction,
          ...prev.transactions
        ] : prev.transactions
      }));
    }
  };

  return {
    incrementSessionCount,
    updateBalance,
    resetBalance
  };
};
