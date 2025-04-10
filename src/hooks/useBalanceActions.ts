import { UserData } from "@/types/userData";
import { useUserSession } from './useUserSession';
import { BalanceUpdateResult } from './session/useBalanceOperations';

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

interface TempTransaction {
  id: string;
  date: string;
  gain: number;
  amount: number;
  report: string;
  type: string;
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
      
      // Toujours récupérer la dernière valeur persistée avant de calculer le nouveau solde
      let currentBalanceBeforeUpdate = userData.balance;
      
      try {
        const storedBalance = localStorage.getItem('currentBalance');
        if (storedBalance) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance) && parsedBalance > currentBalanceBeforeUpdate) {
            currentBalanceBeforeUpdate = parsedBalance;
            console.log(`Using persisted balance from localStorage: ${currentBalanceBeforeUpdate}`);
          }
        }
      } catch (e) {
        console.error("Failed to read persisted balance:", e);
      }
      
      // Calculate new balance with gain
      const calculatedNewBalance = Number((currentBalanceBeforeUpdate + gain).toFixed(2));
      
      // Always persist the latest balance in localStorage
      try {
        console.log(`Persisting new balance: ${calculatedNewBalance}`);
        localStorage.setItem('currentBalance', calculatedNewBalance.toString());
        localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
        localStorage.setItem('lastKnownBalance', calculatedNewBalance.toString());
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
          // Start with the local calculated balance which should be most up-to-date
          let newBalance = calculatedNewBalance;
          
          // Only use API balance if available and higher than our calculated balance
          if (result.newBalance !== undefined && result.newBalance > calculatedNewBalance) {
            newBalance = result.newBalance;
          }
          
          // Try getting persisted balance one more time as a final check
          try {
            const latestPersistedBalance = localStorage.getItem('currentBalance');
            if (latestPersistedBalance) {
              const parsedBalance = parseFloat(latestPersistedBalance);
              if (!isNaN(parsedBalance) && parsedBalance > newBalance) {
                newBalance = parsedBalance;
              }
            }
          } catch (e) {
            console.error("Failed to get latest persisted balance:", e);
          }
          
          // Update localStorage with final value for complete consistency
          try {
            localStorage.setItem('currentBalance', newBalance.toString());
            localStorage.setItem('lastKnownBalance', newBalance.toString());
          } catch (e) {
            console.error("Failed to persist final balance value:", e);
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
        
        // Make sure localStorage is still updated even if API fails
        try {
          localStorage.setItem('currentBalance', calculatedNewBalance.toString());
          localStorage.setItem('lastKnownBalance', calculatedNewBalance.toString());
        } catch (e) {
          console.error("Failed to persist balance after API failure:", e);
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
