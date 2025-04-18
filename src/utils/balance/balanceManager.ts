
/**
 * Balance Manager
 * Central module for handling user balance operations
 */

// Storage keys for balance data
const STORAGE_KEYS = {
  CURRENT_BALANCE: 'currentBalance',
  LAST_KNOWN_BALANCE: 'lastKnownBalance',
  SERVER_BALANCE: 'serverBalance',
  HIGHEST_BALANCE: 'highestBalance',
  DAILY_GAINS: 'dailyGains',
  DAILY_SESSIONS: 'dailySessions',
  LAST_RESET_DATE: 'lastResetDate'
};

// Default daily limits by subscription level
const DAILY_LIMITS = {
  freemium: 0.5,
  premium: 2.5,
  pro: 7.5,
  ultimate: 15.0
};

class BalanceManager {
  private balance: number = 0;
  private serverBalance: number = 0;
  private highestBalance: number = 0;
  private dailyGains: number = 0;
  private dailySessions: number = 0;
  private watchers: ((balance: number) => void)[] = [];
  
  constructor() {
    this.loadFromStorage();
    this.checkDailyReset();
  }
  
  // Initialize with a server balance
  initialize(serverBalance: number): void {
    // Only use server balance if it's defined and we don't have a higher local balance
    if (serverBalance !== undefined && serverBalance >= 0) {
      const currentBalance = this.getCurrentBalance();
      
      // If server balance is higher, use that
      if (serverBalance > currentBalance) {
        this.balance = serverBalance;
        this.serverBalance = serverBalance;
        this.saveToStorage();
        this.notifyWatchers();
      }
    }
  }
  
  // Get current balance
  getCurrentBalance(): number {
    return this.balance;
  }
  
  // Get stable balance (for UI consistency)
  getStableBalance(): number {
    return Math.max(this.balance, this.serverBalance);
  }
  
  // Get highest recorded balance
  getHighestBalance(): number {
    return this.highestBalance;
  }
  
  // Add to balance
  addToBalance(amount: number): number {
    if (amount <= 0) return this.balance;
    
    this.balance += amount;
    this.dailyGains += amount;
    
    // Update highest balance if needed
    if (this.balance > this.highestBalance) {
      this.highestBalance = this.balance;
    }
    
    this.saveToStorage();
    this.notifyWatchers();
    return this.balance;
  }
  
  // Update balance (alias for addToBalance with better naming)
  updateBalance(amount: number): number {
    return this.addToBalance(amount);
  }
  
  // Force set balance to a specific value
  forceBalanceSync(newBalance: number): number {
    if (newBalance < 0) return this.balance;
    
    const oldBalance = this.balance;
    this.balance = newBalance;
    
    // Update highest balance if needed
    if (this.balance > this.highestBalance) {
      this.highestBalance = this.balance;
    }
    
    this.saveToStorage();
    this.notifyWatchers();
    return this.balance;
  }
  
  // Subtract from balance
  subtractFromBalance(amount: number): number {
    if (amount <= 0) return this.balance;
    
    this.balance = Math.max(0, this.balance - amount);
    this.saveToStorage();
    this.notifyWatchers();
    return this.balance;
  }
  
  // Reset balance to zero
  resetBalance(): number {
    this.balance = 0;
    this.saveToStorage();
    this.notifyWatchers();
    return 0;
  }
  
  // Sync with server balance
  syncWithServer(serverBalance: number): void {
    if (serverBalance === undefined || serverBalance < 0) return;
    
    this.serverBalance = serverBalance;
    
    // If server balance is higher, update local balance
    if (serverBalance > this.balance) {
      this.balance = serverBalance;
    }
    
    // Update highest balance if needed
    if (this.balance > this.highestBalance) {
      this.highestBalance = this.balance;
    }
    
    this.saveToStorage();
    this.notifyWatchers();
  }
  
  // Get daily gains
  getDailyGains(): number {
    this.checkDailyReset();
    return this.dailyGains;
  }
  
  // Add to daily gains
  addDailyGain(amount: number): number {
    if (amount <= 0) return this.dailyGains;
    
    this.checkDailyReset();
    this.dailyGains += amount;
    this.saveToStorage();
    return this.dailyGains;
  }
  
  // Reset daily gains
  resetDailyGains(): number {
    this.dailyGains = 0;
    this.dailySessions = 0;
    // Update reset date to today
    localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, new Date().toDateString());
    this.saveToStorage();
    return 0;
  }
  
  // Get daily limit based on subscription
  getDailyLimit(subscription: string = 'freemium'): number {
    return DAILY_LIMITS[subscription as keyof typeof DAILY_LIMITS] || DAILY_LIMITS.freemium;
  }
  
  // Increment daily session count
  incrementDailySessions(): number {
    this.checkDailyReset();
    this.dailySessions++;
    this.saveToStorage();
    return this.dailySessions;
  }
  
  // Get daily session count
  getDailySessions(): number {
    this.checkDailyReset();
    return this.dailySessions;
  }
  
  // Add a watcher function to be notified of balance changes
  addWatcher(callback: (balance: number) => void): () => void {
    this.watchers.push(callback);
    
    // Return function to remove the watcher
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }
  
  // Clean up user balance data (for logout)
  cleanupUserBalanceData(): void {
    // Clear all user-specific data
    localStorage.removeItem(STORAGE_KEYS.CURRENT_BALANCE);
    localStorage.removeItem(STORAGE_KEYS.LAST_KNOWN_BALANCE);
    localStorage.removeItem(STORAGE_KEYS.SERVER_BALANCE);
    localStorage.removeItem(STORAGE_KEYS.HIGHEST_BALANCE);
    
    // Reset instance values
    this.balance = 0;
    this.serverBalance = 0;
    this.highestBalance = 0;
    this.dailyGains = 0;
    this.dailySessions = 0;
    
    // Don't notify watchers here as this is called during logout
  }
  
  // Private methods
  
  // Check if we need to reset daily counters
  private checkDailyReset(): void {
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
    
    if (lastResetDate !== today) {
      // Reset daily counters
      this.dailyGains = 0;
      this.dailySessions = 0;
      localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
      this.saveToStorage();
    }
  }
  
  // Save current state to storage
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_BALANCE, this.balance.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_KNOWN_BALANCE, this.balance.toString());
      localStorage.setItem(STORAGE_KEYS.SERVER_BALANCE, this.serverBalance.toString());
      localStorage.setItem(STORAGE_KEYS.HIGHEST_BALANCE, this.highestBalance.toString());
      localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, this.dailyGains.toString());
      localStorage.setItem(STORAGE_KEYS.DAILY_SESSIONS, this.dailySessions.toString());
    } catch (error) {
      console.error('Failed to save balance data to storage:', error);
    }
  }
  
  // Load state from storage
  private loadFromStorage(): void {
    try {
      const storedBalance = localStorage.getItem(STORAGE_KEYS.CURRENT_BALANCE);
      const storedServerBalance = localStorage.getItem(STORAGE_KEYS.SERVER_BALANCE);
      const storedHighestBalance = localStorage.getItem(STORAGE_KEYS.HIGHEST_BALANCE);
      const storedDailyGains = localStorage.getItem(STORAGE_KEYS.DAILY_GAINS);
      const storedDailySessions = localStorage.getItem(STORAGE_KEYS.DAILY_SESSIONS);
      
      this.balance = storedBalance ? parseFloat(storedBalance) : 0;
      this.serverBalance = storedServerBalance ? parseFloat(storedServerBalance) : 0;
      this.highestBalance = storedHighestBalance ? parseFloat(storedHighestBalance) : 0;
      this.dailyGains = storedDailyGains ? parseFloat(storedDailyGains) : 0;
      this.dailySessions = storedDailySessions ? parseInt(storedDailySessions, 10) : 0;
      
      // Ensure we don't have NaN values
      this.balance = isNaN(this.balance) ? 0 : this.balance;
      this.serverBalance = isNaN(this.serverBalance) ? 0 : this.serverBalance;
      this.highestBalance = isNaN(this.highestBalance) ? 0 : this.highestBalance;
      this.dailyGains = isNaN(this.dailyGains) ? 0 : this.dailyGains;
      this.dailySessions = isNaN(this.dailySessions) ? 0 : this.dailySessions;
    } catch (error) {
      console.error('Failed to load balance data from storage:', error);
      // Initialize with defaults
      this.balance = 0;
      this.serverBalance = 0;
      this.highestBalance = 0;
      this.dailyGains = 0;
      this.dailySessions = 0;
    }
  }
  
  // Notify watchers of balance changes
  private notifyWatchers(): void {
    this.watchers.forEach(callback => {
      try {
        callback(this.balance);
      } catch (error) {
        console.error('Error in balance watcher callback:', error);
      }
    });
  }
}

// Export singleton instance
const balanceManager = new BalanceManager();
export default balanceManager;
