
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
    try {
      const newCount = await incrementSession(dailySessionCount);
      if (typeof newCount === 'number') {
        setDailySessionCount(newCount);
      }
    } catch (error) {
      console.error("Failed to increment session count:", error);
    }
  };

  const updateBalance = async (gain: number, report: string) => {
    try {
      console.log("Updating balance with gain:", gain);
      const result = await updateUserBalance(gain, report);
      
      if (result.success) {
        console.log("Balance update successful. New balance:", result.newBalance);
        // Update local state immediately with new balance
        setUserData(prev => {
          const updatedData = {
            ...prev,
            balance: result.newBalance !== undefined ? result.newBalance : prev.balance,
            transactions: result.transaction ? [
              result.transaction,
              ...prev.transactions
            ] : prev.transactions
          };
          console.log("Updated userData state:", updatedData);
          return updatedData;
        });
        
        if (result.limitReached) {
          setShowLimitAlert(true);
        }
      } else {
        console.error("Balance update failed");
      }
    } catch (error) {
      console.error("Error in updateBalance:", error);
    }
  };

  const resetBalance = async () => {
    try {
      const result = await resetUserBalance();
      
      if (result.success) {
        // Safely update state regardless of whether transaction exists
        setUserData(prev => ({
          ...prev,
          balance: 0,
          transactions: result.transaction ? [
            result.transaction,
            ...prev.transactions
          ] : prev.transactions
        }));
      }
    } catch (error) {
      console.error("Error in resetBalance:", error);
    }
  };

  return {
    incrementSessionCount,
    updateBalance,
    resetBalance
  };
};
