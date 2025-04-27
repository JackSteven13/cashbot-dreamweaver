
/**
 * Interface for the balance manager instance
 */
export interface BalanceManagerInstance {
  // Core balance methods
  getCurrentBalance: () => number;
  forceBalanceSync: (newBalance: number, userId?: string) => void;
  updateBalance: (amount: number) => boolean;
  
  // Daily gains methods
  getDailyGains: () => number;
  setDailyGains: (amount: number) => void;
  addDailyGain: (amount: number) => boolean;
  syncDailyGainsFromTransactions: (amount: number) => void;
  
  // History tracking
  getHighestBalance: () => number;
  updateHighestBalance: (balance: number) => void;
  
  // User management
  setUserId: (userId: string) => void;
  getUserId: () => string | null;
  
  // Event subscription
  addWatcher: (callback: (newBalance: number) => void) => (() => void);
  
  // Advanced features
  checkForSignificantBalanceChange?: (newBalance: number) => boolean;
  
  // Daily limit checking
  isDailyLimitReached: (subscription: string) => boolean;
  getRemainingDailyAllowance: (subscription: string) => number;
  
  // New method: Hard validation of gains to prevent exceeding limit
  validateGainAgainstDailyLimit: (amount: number, subscription: string) => { allowed: boolean; adjustedAmount: number };
  
  // Reset methods for debugging and testing
  resetBalance?: () => boolean;
  resetDailyGains?: () => void;
}
