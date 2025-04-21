
/**
 * Centralized balance manager to maintain consistent state
 * across the application and enforce daily limits
 */
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';

class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private lastResetDate: string = '';
  private watchers: Array<(newBalance: number) => void> = [];
  private dailyWatchers: Array<(dailyGains: number) => void> = [];
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    // Load balance from localStorage
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      if (storedBalance) {
        this.currentBalance = parseFloat(storedBalance);
      }
      
      // Load daily gains with date validation
      const storedDate = localStorage.getItem('currentDate');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // If date changed, reset daily gains
      if (storedDate !== today) {
        console.log(`New day detected: ${today} vs stored ${storedDate}, resetting daily tracking`);
        this.dailyGains = 0;
        this.lastResetDate = today;
        localStorage.setItem('currentDate', today);
        localStorage.setItem('dailyGains', '0');
      } else {
        // Same day, load daily gains
        const storedDailyGains = localStorage.getItem('dailyGains');
        if (storedDailyGains) {
          this.dailyGains = parseFloat(storedDailyGains);
        }
        this.lastResetDate = storedDate || today;
      }
      
      // Log initial state
      console.log(`BalanceManager initialized: balance=${this.currentBalance}, dailyGains=${this.dailyGains}, date=${this.lastResetDate}`);
    } catch (e) {
      console.error("Error initializing BalanceManager:", e);
    }
  }
  
  // Get current balance
  getCurrentBalance(): number {
    return this.currentBalance;
  }
  
  // Get daily gains
  getDailyGains(): number {
    this.checkDateReset();
    return this.dailyGains;
  }
  
  // Get remaining daily limit based on subscription
  getRemainingDailyLimit(subscription: string): number {
    this.checkDateReset();
    const limit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    return Math.max(0, limit - this.dailyGains);
  }
  
  // Check if daily limit reached
  isDailyLimitReached(subscription: string): boolean {
    this.checkDateReset();
    const limit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    return this.dailyGains >= limit;
  }
  
  // Update balance with a new gain
  updateBalance(gain: number): number {
    const newBalance = parseFloat((this.currentBalance + gain).toFixed(2));
    this.setBalance(newBalance);
    return this.currentBalance;
  }
  
  // Set balance directly (use carefully)
  setBalance(newBalance: number): void {
    if (isNaN(newBalance) || newBalance < 0) {
      console.error(`Invalid balance: ${newBalance}`);
      return;
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance = parseFloat(newBalance.toFixed(2));
    
    // Persist to localStorage
    localStorage.setItem('currentBalance', this.currentBalance.toString());
    localStorage.setItem('lastKnownBalance', this.currentBalance.toString());
    
    // Notify watchers only if balance changed
    if (oldBalance !== this.currentBalance) {
      this.notifyWatchers();
    }
  }
  
  // Force balance synchronization with server data
  forceBalanceSync(serverBalance: number): void {
    if (isNaN(serverBalance) || serverBalance < 0) {
      console.error(`Invalid server balance: ${serverBalance}`);
      return;
    }
    
    // Only update if server balance is significantly different
    if (Math.abs(this.currentBalance - serverBalance) > 0.01) {
      console.log(`Force syncing balance from ${this.currentBalance} to ${serverBalance}`);
      this.currentBalance = parseFloat(serverBalance.toFixed(2));
      
      // Persist to localStorage
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      localStorage.setItem('lastKnownBalance', this.currentBalance.toString());
      
      this.notifyWatchers();
    }
  }
  
  // Add to daily gains
  addDailyGain(gain: number): number {
    this.checkDateReset();
    
    if (gain <= 0) return this.dailyGains;
    
    const newDailyGains = parseFloat((this.dailyGains + gain).toFixed(2));
    this.dailyGains = newDailyGains;
    
    // Persist to localStorage
    localStorage.setItem('dailyGains', this.dailyGains.toString());
    
    // Notify watchers
    this.notifyDailyWatchers();
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('dailyGains:updated', {
      detail: { gains: this.dailyGains }
    }));
    
    return this.dailyGains;
  }
  
  // Set daily gains directly (for synchronization)
  setDailyGains(gains: number): void {
    if (isNaN(gains) || gains < 0) {
      console.error(`Invalid daily gains: ${gains}`);
      return;
    }
    
    this.checkDateReset();
    this.dailyGains = parseFloat(gains.toFixed(2));
    
    // Persist to localStorage
    localStorage.setItem('dailyGains', this.dailyGains.toString());
    
    // Notify watchers
    this.notifyDailyWatchers();
  }
  
  // Reset daily gains (typically at midnight)
  resetDailyGains(): void {
    const today = new Date().toISOString().split('T')[0];
    this.dailyGains = 0;
    this.lastResetDate = today;
    
    // Persist to localStorage
    localStorage.setItem('dailyGains', '0');
    localStorage.setItem('currentDate', today);
    
    // Notify watchers
    this.notifyDailyWatchers();
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('dailyGains:reset'));
    
    console.log(`Daily gains reset for ${today}`);
  }
  
  // Check if date has changed and reset if needed
  private checkDateReset(): boolean {
    const today = new Date().toISOString().split('T')[0];
    if (this.lastResetDate !== today) {
      console.log(`Date change detected: ${this.lastResetDate} -> ${today}`);
      this.resetDailyGains();
      return true;
    }
    return false;
  }
  
  // Add a watcher for balance changes
  addWatcher(callback: (newBalance: number) => void): () => void {
    this.watchers.push(callback);
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }
  
  // Add a watcher for daily gains changes
  addDailyWatcher(callback: (dailyGains: number) => void): () => void {
    this.dailyWatchers.push(callback);
    return () => {
      this.dailyWatchers = this.dailyWatchers.filter(watcher => watcher !== callback);
    };
  }
  
  // Notify all balance watchers
  private notifyWatchers(): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(this.currentBalance);
      } catch (e) {
        console.error("Error in balance watcher:", e);
      }
    });
  }
  
  // Notify all daily gains watchers
  private notifyDailyWatchers(): void {
    this.dailyWatchers.forEach(watcher => {
      try {
        watcher(this.dailyGains);
      } catch (e) {
        console.error("Error in daily gains watcher:", e);
      }
    });
  }
}

// Singleton instance
const balanceManager = new BalanceManager();
export default balanceManager;
