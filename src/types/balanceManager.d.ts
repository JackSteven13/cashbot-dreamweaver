
/**
 * Interface for the balance manager instance
 */
export interface BalanceManagerInstance {
  // Core balance methods
  getCurrentBalance: () => number;
  forceBalanceSync: (newBalance: number, userId?: string | null) => void;
  updateBalance: (amount: number, userId?: string | null) => void;
  
  // Daily gains methods
  getDailyGains: () => number;
  setDailyGains: (amount: number) => void;
  addDailyGain: (amount: number) => void;
  resetDailyGains: () => void;
  
  // History tracking
  getHighestBalance: () => number;
  updateHighestBalance: (balance: number) => void;
  
  // Event subscription
  addWatcher: (callback: (newBalance: number) => void) => (() => void);
  
  // Advanced features
  checkForSignificantBalanceChange: (newBalance: number) => boolean;
  
  // User management
  setUserId: (userId: string | null) => void;
  getUserId: () => string | null;
}
