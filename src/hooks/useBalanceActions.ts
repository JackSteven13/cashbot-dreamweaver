
import { UserData, Transaction } from "@/types/userData";
import { useUserSession } from './useUserSession';

interface BalanceActionsResult {
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
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

interface TempTransaction extends Transaction {
  id: string;
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

  const updateBalance = async (gain: number, report: string, forceUpdate = false) => {
    try {
      console.log("Updating balance with gain:", gain, "force update:", forceUpdate);
      
      // If force update is set, update local state immediately before API call
      if (forceUpdate) {
        const calculatedNewBalance = Number((userData.balance + gain).toFixed(2));
        console.log("Force updating UI before API call. New balance:", calculatedNewBalance);
        
        // Create a temporary transaction for immediate feedback
        const newTransaction: TempTransaction = {
          date: new Date().toISOString(),
          gain: gain,
          amount: gain,
          report: report,
          type: "Système",
          id: `temp-${Date.now()}`
        };
        
        setUserData(prevData => ({
          ...prevData,
          balance: calculatedNewBalance,
          transactions: [newTransaction, ...prevData.transactions]
        }));
      }
      
      const result = await updateUserBalance(gain, report);
      
      if (result.success) {
        console.log("Balance update successful. New balance from API:", result.newBalance);
        
        // Update state after API call to ensure consistency with backend data
        setUserData(prevData => {
          const newBalance = result.newBalance !== undefined ? result.newBalance : prevData.balance;
          
          // Only add transaction if we didn't already add a temporary one
          if (!forceUpdate && result.transaction) {
            const transactionData = result.transaction;
            const newTransaction: TempTransaction = {
              date: transactionData.date,
              amount: transactionData.gain,
              type: "Système",
              report: transactionData.report,
              gain: transactionData.gain,
              id: `tx-${Date.now()}`
            };
            
            return {
              ...prevData,
              balance: newBalance,
              transactions: [newTransaction, ...prevData.transactions]
            };
          }
          
          // If we already added a temporary transaction, just update the balance
          return {
            ...prevData,
            balance: newBalance
          };
        });
        
        if (result.limitReached) {
          setShowLimitAlert(true);
        }
      } else {
        console.error("Balance update failed");
        // If API call fails and we had force updated, revert to original balance
        if (forceUpdate) {
          console.log("API call failed, reverting to original balance:", userData.balance);
          setUserData(prevData => ({
            ...prevData,
            balance: userData.balance,
            // Remove the temporary transaction
            transactions: prevData.transactions.filter(tx => !(tx as TempTransaction).id?.toString().startsWith('temp-'))
          }));
        }
      }
    } catch (error) {
      console.error("Error in updateBalance:", error);
      // If error occurs and we had force updated, revert to original balance
      if (forceUpdate) {
        console.log("Error occurred, reverting to original balance:", userData.balance);
        setUserData(prevData => ({
          ...prevData,
          balance: userData.balance,
          // Remove the temporary transaction
          transactions: prevData.transactions.filter(tx => !(tx as TempTransaction).id?.toString().startsWith('temp-'))
        }));
      }
    }
  };

  const resetBalance = async () => {
    try {
      const result = await resetUserBalance();
      
      if (result.success) {
        setUserData(prev => {
          // Create a properly formatted Transaction object if a transaction exists
          let newTransaction: TempTransaction | null = null;
          
          if (result.transaction) {
            newTransaction = {
              date: result.transaction.date,
              amount: -result.transaction.gain, // Negative amount for withdrawals
              type: "Retrait",
              report: result.transaction.report,
              gain: -result.transaction.gain,
              id: `withdraw-${Date.now()}`
            };
          }
          
          return {
            ...prev,
            balance: 0,
            transactions: newTransaction ? [
              newTransaction,
              ...prev.transactions
            ] : prev.transactions
          };
        });
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
