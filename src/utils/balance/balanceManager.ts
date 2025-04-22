
/**
 * Balance Manager - Singleton to manage user balance state
 */

interface BalanceWatcher {
  (newBalance: number): void;
}

class BalanceManager {
  private balance: number = 0;
  private userId: string | null = null;
  private dailyGains: number = 0;
  private watchers: BalanceWatcher[] = [];
  private isInitialized: boolean = false;
  private highestBalance: number = 0;

  constructor() {
    this.initFromStorage();
  }

  /**
   * Initialize balance from localStorage
   */
  private initFromStorage(): void {
    try {
      // Try to get user-specific balance first
      const userId = this.getUserIdFromStorage();
      if (userId) {
        this.userId = userId;
        const userSpecificBalance = localStorage.getItem(`currentBalance_${userId}`);
        if (userSpecificBalance) {
          const parsedBalance = parseFloat(userSpecificBalance);
          if (!isNaN(parsedBalance)) {
            this.balance = parsedBalance;
            this.isInitialized = true;
          }
        }
      }

      // Fallback to general balance
      if (!this.isInitialized) {
        const storedBalance = localStorage.getItem('currentBalance');
        if (storedBalance) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance)) {
            this.balance = parsedBalance;
            this.isInitialized = true;
          }
        }
      }

      // Initialize daily gains
      const storedDailyGains = localStorage.getItem('dailyGains');
      if (storedDailyGains) {
        const parsedDailyGains = parseFloat(storedDailyGains);
        if (!isNaN(parsedDailyGains)) {
          this.dailyGains = parsedDailyGains;
        }
      }

      // Initialize highest balance
      if (this.userId) {
        const storedHighestBalance = localStorage.getItem(`highest_balance_${this.userId}`);
        if (storedHighestBalance) {
          const parsedHighestBalance = parseFloat(storedHighestBalance);
          if (!isNaN(parsedHighestBalance)) {
            this.highestBalance = parsedHighestBalance;
          }
        }
      } else {
        const storedHighestBalance = localStorage.getItem('highest_balance');
        if (storedHighestBalance) {
          const parsedHighestBalance = parseFloat(storedHighestBalance);
          if (!isNaN(parsedHighestBalance)) {
            this.highestBalance = parsedHighestBalance;
          }
        }
      }

      // If highest balance is not set, use current balance as reference
      if (this.highestBalance === 0 && this.balance > 0) {
        this.highestBalance = this.balance;
      }

      console.log(`BalanceManager initialized: balance=${this.balance}, dailyGains=${this.dailyGains}, highestBalance=${this.highestBalance}`);
    } catch (error) {
      console.error("Error initializing balance from storage:", error);
    }
  }

  /**
   * Get user ID from any available storage location
   */
  private getUserIdFromStorage(): string | null {
    try {
      // Try different locations for user ID
      const userIdLocations = [
        localStorage.getItem('userId'),
        localStorage.getItem('user_id'),
        localStorage.getItem('currentUserId'),
        localStorage.getItem('auth.userId')
      ];

      for (const possibleId of userIdLocations) {
        if (possibleId && possibleId.length > 10) {
          return possibleId;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Update balance in memory and storage
   */
  updateBalance(amount: number): number {
    const newBalance = parseFloat((this.balance + amount).toFixed(2));
    this.balance = newBalance;
    this.persistBalance();
    this.updateHighestBalance(newBalance);
    this.notifyWatchers();
    return this.balance;
  }

  /**
   * Force balance to a specific value and persist it
   */
  forceBalanceSync(newBalance: number, userId?: string | null): number {
    if (userId) {
      this.userId = userId;
    }

    this.balance = parseFloat(newBalance.toFixed(2));
    this.persistBalance();
    this.updateHighestBalance(newBalance);
    this.notifyWatchers();
    return this.balance;
  }

  /**
   * Get current balance
   */
  getCurrentBalance(): number {
    return this.balance;
  }

  /**
   * Get the highest balance ever recorded
   */
  getHighestBalance(): number {
    return this.highestBalance;
  }

  /**
   * Update the highest balance if the new balance is higher
   */
  updateHighestBalance(balance: number): void {
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      // Store highest balance with user-specific key if available
      if (this.userId) {
        localStorage.setItem(`highest_balance_${this.userId}`, balance.toString());
      } else {
        localStorage.setItem('highest_balance', balance.toString());
      }
    }
  }

  /**
   * Check if the new balance represents a significant change from the stored balance
   * Returns true if the change is significant (>10% different)
   */
  checkForSignificantBalanceChange(newBalance: number): boolean {
    if (this.balance === 0) return newBalance > 0;
    
    const percentDifference = Math.abs((newBalance - this.balance) / this.balance);
    return percentDifference > 0.1; // More than 10% difference
  }

  /**
   * Add to daily gains
   */
  addDailyGain(amount: number): number {
    this.dailyGains = parseFloat((this.dailyGains + amount).toFixed(2));
    this.persistDailyGains();
    return this.dailyGains;
  }

  /**
   * Set daily gains to specific value
   */
  setDailyGains(amount: number): number {
    this.dailyGains = parseFloat(amount.toFixed(2));
    this.persistDailyGains();
    return this.dailyGains;
  }

  /**
   * Get current daily gains
   */
  getDailyGains(): number {
    return this.dailyGains;
  }

  /**
   * Reset daily gains to zero
   */
  resetDailyGains(): void {
    this.dailyGains = 0;
    this.persistDailyGains();
  }

  /**
   * Persist balance to localStorage with redundancy
   */
  private persistBalance(): void {
    try {
      localStorage.setItem('currentBalance', this.balance.toString());
      localStorage.setItem('lastKnownBalance', this.balance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      
      // If we have a user ID, store user-specific balance as well
      if (this.userId) {
        localStorage.setItem(`currentBalance_${this.userId}`, this.balance.toString());
        localStorage.setItem(`lastUpdatedBalance_${this.userId}`, this.balance.toString());
        // Also store in sessionStorage as another backup
        try {
          sessionStorage.setItem(`currentBalance_${this.userId}`, this.balance.toString());
        } catch (e) {
          // Session storage might fail in some browsers/contexts
        }
      }
    } catch (error) {
      console.error("Error persisting balance:", error);
    }
  }

  /**
   * Persist daily gains to localStorage
   */
  private persistDailyGains(): void {
    try {
      localStorage.setItem('dailyGains', this.dailyGains.toString());
      
      // Store user-specific daily gains if we have a userId
      if (this.userId) {
        localStorage.setItem(`dailyGains_${this.userId}`, this.dailyGains.toString());
      }
    } catch (error) {
      console.error("Error persisting daily gains:", error);
    }
  }

  /**
   * Add a watcher function to be notified of balance changes
   */
  addWatcher(watcher: BalanceWatcher): () => void {
    this.watchers.push(watcher);
    return () => {
      this.watchers = this.watchers.filter(w => w !== watcher);
    };
  }

  /**
   * Notify all watchers of new balance
   */
  private notifyWatchers(): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(this.balance);
      } catch (error) {
        console.error("Error in balance watcher:", error);
      }
    });
  }
}

// Create singleton instance
const balanceManager = new BalanceManager();

// Export singleton
export default balanceManager;
