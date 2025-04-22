
/**
 * Interface for the balance manager instance
 */
export interface BalanceManagerInstance {
  // Core balance methods
  getCurrentBalance: () => number;
  forceBalanceSync: (newBalance: number, userId?: string) => void;
  updateBalance?: (amount: number) => void;
  addDailyGain?: (amount: number) => void;
  
  // Daily gains methods
  getDailyGains: () => number;
  setDailyGains?: (amount: number) => void;
  
  // History tracking
  getHighestBalance?: () => number;
  updateHighestBalance?: (balance: number) => void;
  
  // Event subscription
  addWatcher?: (callback: (newBalance: number) => void) => (() => void);
  
  // Advanced features
  checkForSignificantBalanceChange?: (newBalance: number) => boolean;
}

/**
 * Extended balance manager with all optional methods implemented
 */
export interface ExtendedBalanceManagerInstance extends BalanceManagerInstance {
  setDailyGains: (amount: number) => void;
  getHighestBalance: () => number;
  updateHighestBalance: (balance: number) => void;
  addWatcher: (callback: (newBalance: number) => void) => (() => void);
  checkForSignificantBalanceChange: (newBalance: number) => boolean;
  updateBalance: (amount: number) => void;
  addDailyGain: (amount: number) => void;
}
