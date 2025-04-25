
import { persistBalance, getPersistedBalance } from './balanceStorage';
import { DailyGainsManager } from './modules/dailyGains';
import { BalanceWatcher } from './modules/balanceWatcher';

class BalanceManager {
  private currentBalance: number = 0;
  private highestBalance: number = 0;
  private userId: string | null = null;
  private lastSyncTimestamp: number = 0;
  
  private dailyGainsManager: DailyGainsManager;
  private balanceWatcher: BalanceWatcher;
  
  constructor() {
    this.dailyGainsManager = new DailyGainsManager();
    this.balanceWatcher = new BalanceWatcher();
    
    // Initialize with persisted balance
    this.currentBalance = getPersistedBalance(this.userId);
    
    // Try to get highest balance from localStorage
    try {
      const storedHighestBalance = localStorage.getItem(this.userId ? `highest_balance_${this.userId}` : 'highest_balance');
      if (storedHighestBalance !== null) {
        this.highestBalance = parseFloat(storedHighestBalance);
      }
    } catch (e) {
      console.error('Failed to load highest balance:', e);
    }
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    window.addEventListener('db:balance-updated', ((event: CustomEvent) => {
      if (event.detail && typeof event.detail.newBalance === 'number') {
        const dbBalance = event.detail.newBalance;
        if (dbBalance > this.currentBalance || event.detail.force) {
          console.log(`Updating balance from DB sync: ${this.currentBalance} -> ${dbBalance}`);
          this.forceBalanceSync(dbBalance);
        }
      }
    }) as EventListener);
  }
  
  // Core balance methods
  getCurrentBalance(): number {
    if (!isNaN(this.currentBalance)) {
      return this.currentBalance;
    }
    
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
    
    persistBalance(this.currentBalance, this.userId);
    this.updateHighestBalance(this.currentBalance);
    this.balanceWatcher.notifyWatchers(this.currentBalance);
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
    
    if (newBalance > oldBalance || Date.now() - this.lastSyncTimestamp > 5000) {
      this.currentBalance = newBalance;
      persistBalance(this.currentBalance, this.userId);
      this.updateHighestBalance(this.currentBalance);
      
      if (oldBalance !== newBalance) {
        console.log(`Balance force synced: ${oldBalance} -> ${newBalance}`);
        this.balanceWatcher.notifyWatchers(this.currentBalance);
      }
      
      this.lastSyncTimestamp = Date.now();
    } else {
      console.log(`Ignoring DB sync with lower balance: DB=${newBalance}, Local=${oldBalance}`);
    }
  }
  
  // User management
  setUserId(userId: string | null): void {
    if (this.userId !== userId) {
      this.userId = userId;
      this.currentBalance = getPersistedBalance(userId);
      this.dailyGainsManager.setUserId(userId);
    }
  }
  
  // Daily gains methods - delegate to dailyGainsManager
  getDailyGains = (): number => this.dailyGainsManager.getDailyGains();
  setDailyGains = (amount: number): void => this.dailyGainsManager.setDailyGains(amount);
  addDailyGain = (amount: number): void => this.dailyGainsManager.addDailyGain(amount);
  resetDailyGains = (): void => this.dailyGainsManager.resetDailyGains();
  
  // History tracking
  getHighestBalance(): number {
    return this.highestBalance;
  }
  
  updateHighestBalance(balance: number): void {
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      try {
        localStorage.setItem(this.userId ? `highest_balance_${this.userId}` : 'highest_balance', balance.toString());
      } catch (e) {
        console.error('Failed to store highest balance:', e);
      }
    }
  }
  
  // Event subscription
  addWatcher(callback: (newBalance: number) => void): () => void {
    return this.balanceWatcher.addWatcher(callback);
  }
  
  // Advanced features
  checkForSignificantBalanceChange(newBalance: number): boolean {
    const threshold = Math.max(this.currentBalance * 0.01, 0.01);
    return Math.abs(newBalance - this.currentBalance) > threshold;
  }
}

// Create a singleton instance
const balanceManager = new BalanceManager();

export default balanceManager;
