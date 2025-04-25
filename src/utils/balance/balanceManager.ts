
import { persistBalance, getPersistedBalance } from './balanceStorage';
import { DailyGainsManager } from './modules/dailyGains';
import { BalanceWatcher } from './modules/balanceWatcher';

class BalanceManager {
  private currentBalance: number = 0;
  private highestBalance: number = 0;
  private userId: string | null = null;
  private lastSyncTimestamp: number = 0;
  private updatingBalance: boolean = false;
  private updateQueue: number[] = [];
  private pendingTimeout: NodeJS.Timeout | null = null;
  
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
          console.log(`Updating balance from DB sync: ${this.currentBalance.toFixed(2)} -> ${dbBalance.toFixed(2)}`);
          this.forceBalanceSync(dbBalance);
        } else {
          console.log(`Ignoring DB sync with lower balance: DB=${dbBalance.toFixed(2)}, Local=${this.currentBalance.toFixed(2)}`);
        }
      }
    }) as EventListener);
    
    // Listen for balance reset events
    window.addEventListener('balance:reset', () => {
      console.log('Balance reset event received');
      this.resetUpdateQueue();
    });
    
    // Listen for browser visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Flush any pending updates before page becomes hidden
        this.flushUpdateQueue();
      } else {
        // Page is visible again, check if we need to reset the queue
        this.resetUpdateQueue();
      }
    });
  }
  
  private resetUpdateQueue(): void {
    this.updateQueue = [];
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    this.updatingBalance = false;
  }
  
  private flushUpdateQueue(): void {
    if (this.updateQueue.length === 0) return;
    
    const totalUpdate = this.updateQueue.reduce((sum, amount) => sum + amount, 0);
    if (totalUpdate !== 0) {
      this.processBalanceUpdate(totalUpdate);
    }
    
    this.resetUpdateQueue();
  }
  
  private processBalanceUpdate(amount: number): void {
    // Apply the actual balance change
    const oldBalance = this.currentBalance;
    
    // Round to 2 decimal places to avoid floating point errors
    this.currentBalance = Math.round((this.currentBalance + amount) * 100) / 100;
    
    persistBalance(this.currentBalance, this.userId);
    this.updateHighestBalance(this.currentBalance);
    this.balanceWatcher.notifyWatchers(this.currentBalance);
    this.lastSyncTimestamp = Date.now();
    
    console.log(`Balance updated: ${oldBalance.toFixed(2)} -> ${this.currentBalance.toFixed(2)} (${amount > 0 ? '+' : ''}${amount.toFixed(4)})`);
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
    
    if (amount === 0) {
      return this.currentBalance;
    }
    
    // Round amount to 4 decimal places for consistency
    const roundedAmount = Math.round(amount * 10000) / 10000;
    
    if (this.updatingBalance) {
      // Queue the update to avoid race conditions
      this.updateQueue.push(roundedAmount);
      
      // Set a timeout to flush the queue if no more updates come in
      if (this.pendingTimeout) {
        clearTimeout(this.pendingTimeout);
      }
      
      this.pendingTimeout = setTimeout(() => {
        this.flushUpdateQueue();
      }, 200);
      
      return this.currentBalance;
    }
    
    this.updatingBalance = true;
    
    try {
      this.processBalanceUpdate(roundedAmount);
    } finally {
      this.updatingBalance = false;
      
      // Process any queued updates
      if (this.updateQueue.length > 0) {
        setTimeout(() => this.flushUpdateQueue(), 50);
      }
    }
    
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
    
    // Reset any pending updates when forcing a sync
    this.resetUpdateQueue();
    
    const oldBalance = this.currentBalance;
    
    // Always use the higher precision value from the two sources
    if (newBalance > oldBalance || Date.now() - this.lastSyncTimestamp > 5000) {
      // Round to 2 decimal places for consistent display
      const roundedBalance = Math.round(newBalance * 100) / 100;
      this.currentBalance = roundedBalance;
      persistBalance(this.currentBalance, this.userId);
      this.updateHighestBalance(this.currentBalance);
      
      if (oldBalance !== roundedBalance) {
        console.log(`Balance force synced: ${oldBalance.toFixed(2)} -> ${roundedBalance.toFixed(2)}`);
        this.balanceWatcher.notifyWatchers(this.currentBalance);
      }
      
      this.lastSyncTimestamp = Date.now();
    } else {
      console.log(`Ignoring DB sync with lower balance: DB=${newBalance.toFixed(2)}, Local=${oldBalance.toFixed(2)}`);
    }
  }
  
  // User management
  setUserId(userId: string | null): void {
    if (this.userId !== userId) {
      this.userId = userId;
      this.currentBalance = getPersistedBalance(userId);
      this.dailyGainsManager.setUserId(userId);
      
      // Reset update queue when changing users
      this.resetUpdateQueue();
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
  
  // Debug function to get balance state
  getDebugInfo(): object {
    return {
      currentBalance: this.currentBalance,
      highestBalance: this.highestBalance,
      userId: this.userId,
      lastSyncTimestamp: this.lastSyncTimestamp,
      updatingBalance: this.updatingBalance,
      queuedUpdates: this.updateQueue.length,
      dailyGains: this.getDailyGains()
    };
  }
}

// Create a singleton instance
const balanceManager = new BalanceManager();

export default balanceManager;
