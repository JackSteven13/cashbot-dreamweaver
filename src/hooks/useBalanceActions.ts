
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
      
      // Always persist the latest balance in localStorage
      const currentBalanceBeforeUpdate = userData.balance;
      const calculatedNewBalance = Number((currentBalanceBeforeUpdate + gain).toFixed(2));
      
      try {
        localStorage.setItem('currentBalance', calculatedNewBalance.toString());
        localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
        localStorage.setItem('lastKnownBalance', calculatedNewBalance.toString()); // Synchroniser avec les autres références
      } catch (e) {
        console.error("Failed to persist balance in localStorage:", e);
      }
      
      // If force update is set, update local state immediately before API call
      if (forceUpdate) {
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
        
        // Déclencher un événement global pour informer les autres composants de la mise à jour
        window.dispatchEvent(new CustomEvent('balance:force-update', { 
          detail: { 
            newBalance: calculatedNewBalance,
            gain: gain,
            transaction: newTransaction
          }
        }));
        
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
          let newBalance = calculatedNewBalance;
          
          // Only use API balance if available, otherwise keep calculated balance
          if (result.newBalance !== undefined) {
            newBalance = result.newBalance;
          }
          
          // Always ensure we don't lose track of accumulated gain
          // If API balance is less than our calculated balance, use the higher value
          if (newBalance < calculatedNewBalance) {
            console.log("API balance is less than calculated balance, using calculated balance");
            newBalance = calculatedNewBalance;
          }
          
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
        
        // Even if API call fails, we keep the updated balance in state to prevent regression
        // This ensures users don't see their balance disappear
        if (!forceUpdate) {
          // Only update state if we haven't already updated it with force update
          setUserData(prevData => ({
            ...prevData,
            balance: calculatedNewBalance,
          }));
        }
      }
    } catch (error) {
      console.error("Error in updateBalance:", error);
      // Even if error occurs, keep the updated balance to prevent regression
    }
  };

  const resetBalance = async () => {
    try {
      const result = await resetUserBalance();
      
      if (result.success) {
        // Clear balance in localStorage on successful reset
        localStorage.removeItem('currentBalance');
        localStorage.removeItem('lastBalanceUpdateTime');
        localStorage.removeItem('lastKnownBalance');
        
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
