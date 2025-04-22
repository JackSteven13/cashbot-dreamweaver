
import { BalanceManagerInstance } from '@/types/balanceManager';

// Type for balance watcher callbacks
type BalanceWatcherCallback = (newBalance: number) => void;

/**
 * Balance Manager Implementation
 */
const createBalanceManager = (): BalanceManagerInstance => {
  let currentBalance: number = 0;
  let dailyGains: number = 0;
  let highestBalance: number = 0;
  const watchers: BalanceWatcherCallback[] = [];

  // Initialize values from localStorage
  const init = () => {
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      if (storedBalance) {
        currentBalance = parseFloat(storedBalance);
      }

      const storedDailyGains = localStorage.getItem('dailyGains');
      if (storedDailyGains) {
        dailyGains = parseFloat(storedDailyGains);
      }

      const storedHighestBalance = localStorage.getItem('highest_balance');
      if (storedHighestBalance) {
        highestBalance = parseFloat(storedHighestBalance);
      }
    } catch (e) {
      console.error('Error initializing balance manager:', e);
    }
  };

  // Initialize on creation
  init();

  return {
    // Core balance methods
    getCurrentBalance: () => {
      return isNaN(currentBalance) ? 0 : currentBalance;
    },
    
    forceBalanceSync: (newBalance: number, userId?: string) => {
      if (isNaN(newBalance)) return;
      
      currentBalance = newBalance;
      
      // Store in localStorage with both general and user-specific keys if provided
      localStorage.setItem('currentBalance', newBalance.toString());
      
      if (userId) {
        localStorage.setItem(`currentBalance_${userId}`, newBalance.toString());
      }
      
      // Update highest balance if needed
      if (newBalance > highestBalance) {
        highestBalance = newBalance;
        localStorage.setItem('highest_balance', highestBalance.toString());
        
        if (userId) {
          localStorage.setItem(`highest_balance_${userId}`, highestBalance.toString());
        }
      }
      
      // Notify watchers
      watchers.forEach(callback => {
        try {
          callback(currentBalance);
        } catch (e) {
          console.error('Error in balance watcher callback:', e);
        }
      });
    },
    
    // Method to update the balance by adding an amount
    updateBalance: (amount: number) => {
      if (isNaN(amount)) return;
      
      const newBalance = currentBalance + amount;
      currentBalance = newBalance;
      
      // Update localStorage
      localStorage.setItem('currentBalance', newBalance.toString());
      
      // Update highest balance if needed
      if (newBalance > highestBalance) {
        highestBalance = newBalance;
        localStorage.setItem('highest_balance', highestBalance.toString());
      }
      
      // Notify watchers
      watchers.forEach(callback => {
        try {
          callback(currentBalance);
        } catch (e) {
          console.error('Error in balance watcher callback:', e);
        }
      });
    },
    
    // Method to add daily gain
    addDailyGain: (amount: number) => {
      if (isNaN(amount)) return;
      
      dailyGains += amount;
      localStorage.setItem('dailyGains', dailyGains.toString());
      
      // Dispatch event for components that need to react
      window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
        detail: { gains: dailyGains } 
      }));
    },
    
    // Daily gains methods
    getDailyGains: () => {
      // First check localStorage for most recent value
      try {
        const storedDailyGains = localStorage.getItem('dailyGains');
        if (storedDailyGains) {
          const parsedValue = parseFloat(storedDailyGains);
          if (!isNaN(parsedValue)) {
            dailyGains = parsedValue;
          }
        }
      } catch (e) {
        console.error('Error reading daily gains from localStorage:', e);
      }
      
      return isNaN(dailyGains) ? 0 : dailyGains;
    },
    
    setDailyGains: (amount: number) => {
      if (isNaN(amount)) return;
      
      dailyGains = amount;
      localStorage.setItem('dailyGains', amount.toString());
      
      // Dispatch event for components that need to react
      window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
        detail: { gains: amount } 
      }));
    },
    
    // History tracking
    getHighestBalance: () => {
      return isNaN(highestBalance) ? 0 : highestBalance;
    },
    
    updateHighestBalance: (balance: number) => {
      if (isNaN(balance) || balance <= highestBalance) return;
      
      highestBalance = balance;
      localStorage.setItem('highest_balance', balance.toString());
    },
    
    // Event subscription
    addWatcher: (callback: (newBalance: number) => void) => {
      watchers.push(callback);
      
      // Return function to remove watcher
      return () => {
        const index = watchers.indexOf(callback);
        if (index !== -1) {
          watchers.splice(index, 1);
        }
      };
    },
    
    // Advanced features
    checkForSignificantBalanceChange: (newBalance: number) => {
      if (isNaN(newBalance)) return false;
      
      // Consider a change significant if it's more than 5% or 0.5€
      const absoluteDifference = Math.abs(newBalance - currentBalance);
      const percentageDifference = currentBalance > 0 ? absoluteDifference / currentBalance : 1;
      
      return absoluteDifference >= 0.5 || percentageDifference >= 0.05;
    }
  };
};

// Create and export a singleton instance
const balanceManager = createBalanceManager();

export default balanceManager;
