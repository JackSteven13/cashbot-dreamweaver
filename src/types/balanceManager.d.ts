
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
  
  // History tracking
  getHighestBalance: () => number;
  updateHighestBalance: (balance: number) => void;
  
  // User management
  setUserId: (userId: string) => void;
  getUserId?: () => string | null;
  
  // Event subscription
  addWatcher: (callback: (newBalance: number) => void) => (() => void);
  
  // Advanced features
  checkForSignificantBalanceChange?: (newBalance: number) => boolean;
  
  // Daily limit checking
  isDailyLimitReached: (subscription: string) => boolean;
  getRemainingDailyAllowance: (subscription: string) => number;
}
