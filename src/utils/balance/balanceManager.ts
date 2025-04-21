
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';

type BalanceWatcherCallback = (newBalance: number) => void;

class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private lastReset: number = Date.now();
  private syncInProgress: boolean = false;
  private watchers: BalanceWatcherCallback[] = [];
  private highestBalance: number = 0;
  
  constructor() {
    this.initBalance();
    this.checkForDayChange();
    this.startDailyResetCheck();
  }
  
  private initBalance(): void {
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      if (storedBalance) {
        this.currentBalance = parseFloat(storedBalance);
        // Update highest balance if current is higher
        this.highestBalance = Math.max(this.currentBalance, this.getHighestBalance());
      }
      
      const storedDailyGains = localStorage.getItem('dailyGains');
      if (storedDailyGains) {
        this.dailyGains = parseFloat(storedDailyGains);
      }
      
      const storedLastReset = localStorage.getItem('lastBalanceReset');
      if (storedLastReset) {
        this.lastReset = parseInt(storedLastReset, 10);
      }
      
      console.log("BalanceManager initialized:", {
        currentBalance: this.currentBalance,
        dailyGains: this.dailyGains,
        lastReset: new Date(this.lastReset).toISOString(),
        highestBalance: this.highestBalance
      });
    } catch (e) {
      console.error("Error initializing balance manager:", e);
      // Use default values if localStorage access fails
      this.currentBalance = 0;
      this.dailyGains = 0;
      this.lastReset = Date.now();
      this.highestBalance = 0;
    }
  }
  
  private checkForDayChange(): void {
    const now = new Date();
    const lastResetDate = new Date(this.lastReset);
    
    // Check if day has changed
    if (
      now.getDate() !== lastResetDate.getDate() ||
      now.getMonth() !== lastResetDate.getMonth() ||
      now.getFullYear() !== lastResetDate.getFullYear()
    ) {
      this.resetDailyGains();
    }
  }
  
  private startDailyResetCheck(): void {
    // Check for day change every 5 minutes
    setInterval(() => {
      this.checkForDayChange();
    }, 5 * 60 * 1000);
  }
  
  public resetDailyGains(): void {
    console.log("Resetting daily gains (new day)");
    this.dailyGains = 0;
    this.lastReset = Date.now();
    
    try {
      localStorage.setItem('dailyGains', '0');
      localStorage.setItem('lastBalanceReset', this.lastReset.toString());
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('dailyGains:reset'));
    } catch (e) {
      console.error("Error saving reset state:", e);
    }
  }
  
  public updateBalance(amount: number): void {
    if (isNaN(amount)) {
      console.error("Invalid amount provided to updateBalance:", amount);
      return;
    }
    
    this.currentBalance += amount;
    
    // Update highest balance if current is higher
    if (this.currentBalance > this.highestBalance) {
      this.highestBalance = this.currentBalance;
      try {
        localStorage.setItem('highestBalance', this.highestBalance.toString());
      } catch (e) {
        console.error("Error saving highest balance:", e);
      }
    }
    
    try {
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      
      // Notify watchers
      this.notifyWatchers();
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('balance:local-update', {
        detail: { balance: this.currentBalance }
      }));
    } catch (e) {
      console.error("Error saving balance:", e);
    }
  }
  
  public forceBalanceSync(amount: number): void {
    if (isNaN(amount)) {
      console.error("Invalid amount provided to forceBalanceSync:", amount);
      return;
    }
    
    this.currentBalance = amount;
    
    // Update highest balance if current is higher
    if (this.currentBalance > this.highestBalance) {
      this.highestBalance = this.currentBalance;
      try {
        localStorage.setItem('highestBalance', this.highestBalance.toString());
      } catch (e) {
        console.error("Error saving highest balance:", e);
      }
    }
    
    try {
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      
      // Notify watchers
      this.notifyWatchers();
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('balance:local-update', {
        detail: { balance: this.currentBalance, force: true }
      }));
    } catch (e) {
      console.error("Error saving balance:", e);
    }
  }
  
  public addDailyGain(amount: number): void {
    if (isNaN(amount)) {
      console.error("Invalid amount provided to addDailyGain:", amount);
      return;
    }
    
    this.checkForDayChange();
    
    // For freemium accounts, strictly enforce the daily limit
    const subscription = localStorage.getItem('userSubscription') || 'freemium';
    const dailyLimit = this.getDailyLimit(subscription);
    
    // Don't allow exceeding daily limit
    if (this.dailyGains + amount > dailyLimit && subscription === 'freemium') {
      amount = Math.max(0, dailyLimit - this.dailyGains);
      console.log(`Daily limit would be exceeded, adjusting gain to ${amount}€`);
    }
    
    // If gain is 0 or negative, don't process it
    if (amount <= 0) {
      return;
    }
    
    this.dailyGains += amount;
    
    try {
      localStorage.setItem('dailyGains', this.dailyGains.toString());
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('dailyGains:updated', {
        detail: { dailyGains: this.dailyGains }
      }));
    } catch (e) {
      console.error("Error saving daily gains:", e);
    }
  }
  
  public getCurrentBalance(): number {
    return this.currentBalance;
  }
  
  public getDailyGains(): number {
    this.checkForDayChange();
    return this.dailyGains;
  }
  
  public getDailyLimit(subscription: string): number {
    return SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  }
  
  public async syncWithDatabase(): Promise<boolean> {
    if (this.syncInProgress) {
      return false;
    }
    
    this.syncInProgress = true;
    
    try {
      // Note: This is a placeholder for actual database sync
      // In a real implementation, you would call a function to sync with database
      
      console.log("Simulating database sync:", {
        currentBalance: this.currentBalance,
        dailyGains: this.dailyGains
      });
      
      // Wait a bit to simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.syncInProgress = false;
      return true;
    } catch (e) {
      console.error("Error syncing with database:", e);
      this.syncInProgress = false;
      return false;
    }
  }
  
  // Add watcher system for balance updates
  public addWatcher(callback: BalanceWatcherCallback): () => void {
    this.watchers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }
  
  private notifyWatchers(): void {
    this.watchers.forEach(callback => {
      try {
        callback(this.currentBalance);
      } catch (e) {
        console.error("Error in balance watcher callback:", e);
      }
    });
  }
  
  // Get the highest recorded balance
  public getHighestBalance(): number {
    try {
      const storedHighestBalance = localStorage.getItem('highestBalance');
      if (storedHighestBalance) {
        const parsedValue = parseFloat(storedHighestBalance);
        return isNaN(parsedValue) ? 0 : parsedValue;
      }
    } catch (e) {
      console.error("Error getting highest balance:", e);
    }
    return 0;
  }
  
  // Clean up user data when switching users
  public cleanupUserBalanceData(): void {
    this.currentBalance = 0;
    this.dailyGains = 0;
    this.lastReset = Date.now();
    this.highestBalance = 0;
    
    // Clear localStorage entries
    try {
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('dailyGains');
      localStorage.removeItem('lastBalanceReset');
      localStorage.removeItem('highestBalance');
    } catch (e) {
      console.error("Error cleaning up user balance data:", e);
    }
    
    // Notify watchers of reset
    this.notifyWatchers();
    
    console.log("Balance data cleaned for user switch");
  }
}

// Create a singleton instance
const balanceManager = new BalanceManager();

export default balanceManager;
