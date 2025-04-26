
/**
 * Utility to manage balance stability across the application
 * This is a central utility to prevent balance fluctuations
 */

type BalanceListener = (balance: number) => void;

class StableBalanceManager {
  private stableBalance: number = 0;
  private highestBalance: number = 0;
  private listeners: BalanceListener[] = [];
  private lastUpdateTime: number = 0;
  private isInitialized: boolean = false;
  private syncInProgress: boolean = false;
  private lastSyncedBalance: number = 0;
  private syncQueue: number[] = [];
  private updateDebounceTime: number = 500; // Minimum time between updates
  
  constructor() {
    // Initialize with values from localStorage
    this.initialize();
    
    // Listen for window focus to check if balance needs restoration
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.checkAndRestoreBalance);
    }
  }
  
  private initialize() {
    try {
      // Try to get highest known balance from localStorage
      const storedHighest = localStorage.getItem('highest_balance');
      if (storedHighest) {
        const parsed = parseFloat(storedHighest);
        if (!isNaN(parsed) && parsed > 0) {
          this.highestBalance = parsed;
        }
      }
      
      // Try to get current balance from localStorage
      const storedCurrent = localStorage.getItem('currentBalance');
      if (storedCurrent) {
        const parsed = parseFloat(storedCurrent);
        if (!isNaN(parsed) && parsed > 0) {
          this.stableBalance = parsed;
          this.lastSyncedBalance = parsed;
        }
      }
      
      // Safety - ensure stable balance is at least equal to highest balance
      if (this.highestBalance > this.stableBalance) {
        this.stableBalance = this.highestBalance;
      }
      
      // Add event listeners for balance updates
      if (typeof window !== 'undefined') {
        window.addEventListener('balance:update', this.handleBalanceUpdate as EventListener);
        window.addEventListener('balance:force-update', this.handleForceUpdate as EventListener);
      }
      
      this.isInitialized = true;
      console.log(`StableBalanceManager initialized with balance: ${this.stableBalance.toFixed(2)}`);
    } catch (err) {
      console.error('Error initializing StableBalanceManager:', err);
    }
  }
  
  private handleBalanceUpdate = (event: CustomEvent) => {
    const detail = event.detail;
    if (!detail) return;
    
    const amount = detail.amount;
    if (typeof amount === 'number' && amount > 0) {
      const newBalance = this.stableBalance + amount;
      this.updateBalance(newBalance);
    }
  }
  
  private handleForceUpdate = (event: CustomEvent) => {
    const detail = event.detail;
    if (!detail) return;
    
    const newBalance = detail.newBalance;
    if (typeof newBalance === 'number' && newBalance > 0) {
      // Only allow increases or very small decreases (within 1%)
      if (newBalance >= this.stableBalance || 
          (this.stableBalance - newBalance) / this.stableBalance < 0.01) {
        this.updateBalance(newBalance);
      } else {
        console.warn(`Prevented balance decrease: ${this.stableBalance.toFixed(2)} → ${newBalance.toFixed(2)}`);
      }
    }
  }
  
  private updateBalance(newBalance: number) {
    // Prevent rapid updates
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateDebounceTime) {
      // Queue the update
      this.syncQueue.push(newBalance);
      
      // Start processing the queue if not already in progress
      if (!this.syncInProgress) {
        this.syncInProgress = true;
        setTimeout(() => this.processUpdateQueue(), this.updateDebounceTime);
      }
      return;
    }
    
    // Prevent NaN or negative values
    if (isNaN(newBalance) || newBalance < 0) {
      console.warn(`Invalid balance value: ${newBalance}, keeping ${this.stableBalance}`);
      return;
    }
    
    // Update highest observed balance if needed
    if (newBalance > this.highestBalance) {
      this.highestBalance = newBalance;
      localStorage.setItem('highest_balance', newBalance.toString());
    }
    
    // Update the stable balance
    this.stableBalance = newBalance;
    this.lastSyncedBalance = newBalance;
    
    // Save to localStorage with all possible keys for redundancy
    localStorage.setItem('currentBalance', newBalance.toString());
    localStorage.setItem('lastKnownBalance', newBalance.toString());
    localStorage.setItem('lastUpdatedBalance', newBalance.toString());
    
    // Update timestamp
    this.lastUpdateTime = now;
    
    // Notify all listeners
    this.notifyListeners();
    
    console.log(`StableBalance updated to ${newBalance.toFixed(2)}`);
  }
  
  private processUpdateQueue() {
    if (this.syncQueue.length === 0) {
      this.syncInProgress = false;
      return;
    }
    
    // Find the highest value in the queue
    const maxBalance = Math.max(...this.syncQueue);
    
    // Clear the queue
    this.syncQueue = [];
    
    // Update with the highest value
    this.updateBalance(maxBalance);
    
    // Check if there are more updates after this one
    setTimeout(() => {
      if (this.syncQueue.length > 0) {
        this.processUpdateQueue();
      } else {
        this.syncInProgress = false;
      }
    }, this.updateDebounceTime);
  }
  
  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.stableBalance);
      } catch (err) {
        console.error('Error in balance listener:', err);
      }
    }
  }
  
  private checkAndRestoreBalance = () => {
    // If the balance has decreased since last sync, restore it
    const currentLocalBalance = parseFloat(localStorage.getItem('currentBalance') || '0');
    if (currentLocalBalance < this.lastSyncedBalance) {
      console.log(`Restoring balance after focus: ${currentLocalBalance} → ${this.lastSyncedBalance}`);
      this.updateBalance(this.lastSyncedBalance);
    }
  }
  
  // Public API
  
  /**
   * Get the current stable balance
   */
  public getBalance(): number {
    // Always return the highest value between stable balance and highest balance
    return Math.max(this.stableBalance, this.highestBalance);
  }
  
  /**
   * Forcibly set the balance to a specific value
   * Only allows increases, never decreases
   */
  public setBalance(newBalance: number): boolean {
    // Only allow increases
    if (newBalance >= this.stableBalance) {
      this.updateBalance(newBalance);
      return true;
    }
    return false;
  }
  
  /**
   * Add an amount to the current balance
   */
  public addToBalance(amount: number): number {
    if (amount <= 0) return this.stableBalance;
    
    const newBalance = this.stableBalance + amount;
    this.updateBalance(newBalance);
    return newBalance;
  }
  
  /**
   * Register a listener for balance changes
   */
  public addListener(callback: BalanceListener): () => void {
    this.listeners.push(callback);
    
    // Return function to remove this listener
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  /**
   * Get the highest recorded balance
   */
  public getHighestBalance(): number {
    return this.highestBalance;
  }
}

// Create singleton instance
const stableBalance = new StableBalanceManager();

export default stableBalance;
