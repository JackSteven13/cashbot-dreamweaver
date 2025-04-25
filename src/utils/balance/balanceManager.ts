// Utility for managing user balance across the app
import { persistBalance, getPersistedBalance } from './balanceStorage';

class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private highestBalance: number = 0;
  private userId: string | null = null;
  private watchers: Array<(newBalance: number) => void> = [];
  private lastSyncTimestamp: number = 0;
  
  constructor() {
    // Initialize with persisted balance
    this.currentBalance = getPersistedBalance(this.userId);
    
    // Try to get daily gains from localStorage
    try {
      const storedDailyGains = localStorage.getItem(this.userId ? `dailyGains_${this.userId}` : 'dailyGains');
      if (storedDailyGains !== null) {
        this.dailyGains = parseFloat(storedDailyGains);
      }
    } catch (e) {
      console.error('Failed to load daily gains:', e);
    }
    
    // Try to get highest balance from localStorage
    try {
      const storedHighestBalance = localStorage.getItem(this.userId ? `highest_balance_${this.userId}` : 'highest_balance');
      if (storedHighestBalance !== null) {
        this.highestBalance = parseFloat(storedHighestBalance);
      }
    } catch (e) {
      console.error('Failed to load highest balance:', e);
    }
    
    console.log(`BalanceManager initialized with balance: ${this.currentBalance}, daily gains: ${this.dailyGains}`);
    
    // Setup event listener for database sync events
    window.addEventListener('db:balance-updated', ((event: CustomEvent) => {
      if (event.detail && typeof event.detail.newBalance === 'number') {
        // Only update if the DB value is higher or if it's a forced update
        const dbBalance = event.detail.newBalance;
        if (dbBalance > this.currentBalance || event.detail.force) {
          console.log(`Updating balance from DB sync: ${this.currentBalance} -> ${dbBalance}`);
          this.forceBalanceSync(dbBalance);
        }
      }
    }) as EventListener);
  }
  
  setUserId(userId: string | null): void {
    if (this.userId !== userId) {
      this.userId = userId;
      // Reload balance for this user
      this.currentBalance = getPersistedBalance(userId);
      
      // Reload daily gains
      try {
        const storedDailyGains = localStorage.getItem(userId ? `dailyGains_${userId}` : 'dailyGains');
        if (storedDailyGains !== null) {
          this.dailyGains = parseFloat(storedDailyGains);
        } else {
          this.dailyGains = 0;
        }
      } catch (e) {
        console.error('Failed to load daily gains:', e);
        this.dailyGains = 0;
      }
      
      console.log(`User ID set to ${userId}, balance: ${this.currentBalance}, daily gains: ${this.dailyGains}`);
    }
  }

  getCurrentBalance(): number {
    // If we have a valid cached balance, return it
    if (!isNaN(this.currentBalance)) {
      return this.currentBalance;
    }
    
    // Otherwise check local storage
    const persistedBalance = getPersistedBalance(this.userId);
    this.currentBalance = persistedBalance;
    return persistedBalance;
  }
  
  updateBalance(amount: number): number {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to updateBalance:', amount);
      return this.currentBalance;
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance += amount;
    
    // Persist the updated balance
    persistBalance(this.currentBalance, this.userId);
    
    // Update highest balance if needed
    this.updateHighestBalance(this.currentBalance);
    
    // Notify watchers
    this.notifyWatchers();
    
    // Set the last sync timestamp
    this.lastSyncTimestamp = Date.now();
    
    console.log(`Balance updated: ${oldBalance} -> ${this.currentBalance} (${amount > 0 ? '+' : ''}${amount})`);
    
    return this.currentBalance;
  }
  
  forceBalanceSync(newBalance: number, userId: string | null = null): void {
    if (userId !== null && userId !== this.userId) {
      this.setUserId(userId);
    }
    
    if (isNaN(newBalance)) {
      console.error('Invalid balance provided to forceBalanceSync:', newBalance);
      return;
    }
    
    const oldBalance = this.currentBalance;
    
    // Only update if the new balance is greater or we haven't synced recently (prevent flickering)
    if (newBalance > oldBalance || Date.now() - this.lastSyncTimestamp > 5000) {
      this.currentBalance = newBalance;
      
      // Persist the balance locally
      persistBalance(this.currentBalance, this.userId);
      
      // Update highest balance if needed
      this.updateHighestBalance(this.currentBalance);
      
      // Notify watchers if there's a change
      if (oldBalance !== newBalance) {
        console.log(`Balance force synced: ${oldBalance} -> ${newBalance}`);
        this.notifyWatchers();
      }
      
      // Update last sync timestamp
      this.lastSyncTimestamp = Date.now();
    } else {
      console.log(`Ignoring DB sync with lower balance: DB=${newBalance}, Local=${oldBalance}`);
    }
  }
  
  // Daily gains tracking
  getDailyGains(): number {
    return this.dailyGains;
  }
  
  setDailyGains(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to setDailyGains:', amount);
      return;
    }
    
    this.dailyGains = amount;
    
    // Persist in localStorage
    try {
      localStorage.setItem(this.userId ? `dailyGains_${this.userId}` : 'dailyGains', amount.toString());
      console.log(`Daily gains set to ${amount}`);
    } catch (e) {
      console.error('Failed to store daily gains:', e);
    }
  }
  
  addDailyGain(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to addDailyGain:', amount);
      return;
    }
    
    this.dailyGains += amount;
    
    // Persist in localStorage
    try {
      localStorage.setItem(this.userId ? `dailyGains_${this.userId}` : 'dailyGains', this.dailyGains.toString());
      console.log(`Daily gains increased by ${amount} to ${this.dailyGains}`);
    } catch (e) {
      console.error('Failed to store daily gains:', e);
    }
  }
  
  // Highest balance tracking
  getHighestBalance(): number {
    return this.highestBalance;
  }
  
  updateHighestBalance(balance: number): void {
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      
      // Persist in localStorage
      try {
        localStorage.setItem(this.userId ? `highest_balance_${this.userId}` : 'highest_balance', balance.toString());
      } catch (e) {
        console.error('Failed to store highest balance:', e);
      }
    }
  }
  
  // Watch for changes
  addWatcher(callback: (newBalance: number) => void): () => void {
    this.watchers.push(callback);
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }
  
  // Check for significant balance change
  checkForSignificantBalanceChange(newBalance: number): boolean {
    // Significant is defined as more than 1% difference
    const threshold = Math.max(this.currentBalance * 0.01, 0.01);
    return Math.abs(newBalance - this.currentBalance) > threshold;
  }
  
  private notifyWatchers(): void {
    this.watchers.forEach(callback => {
      try {
        callback(this.currentBalance);
      } catch (e) {
        console.error('Error in balance watcher callback:', e);
      }
    });
  }
  
  // New method to reset daily gains
  resetDailyGains(): void {
    this.dailyGains = 0;
    
    // Persist in localStorage
    try {
      localStorage.setItem(this.userId ? `dailyGains_${this.userId}` : 'dailyGains', '0');
      console.log('Daily gains reset to 0');
    } catch (e) {
      console.error('Failed to reset daily gains:', e);
    }
  }
}

// Create a singleton instance
const balanceManager = new BalanceManager();

export default balanceManager;
