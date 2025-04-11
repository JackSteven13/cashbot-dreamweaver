
// Balance manager for centralized balance state management
class BalanceManager {
  private lastKnownBalance: number = 0;
  private highestBalance: number = 0;
  private subscribers: Array<(state: any) => void> = [];
  private userId: string | null = null;
  private todaysGains: number = 0;

  // Initialize with a starting balance value
  initialize(startingBalance: number, userId?: string | null) {
    if (startingBalance > this.lastKnownBalance) {
      this.lastKnownBalance = startingBalance;
    }
    
    if (startingBalance > this.highestBalance) {
      this.highestBalance = startingBalance;
    }
    
    if (userId) {
      this.userId = userId;
    }
    
    // Notify all subscribers
    this.notifySubscribers();
  }
  
  // Update balance with a gain amount
  updateBalance(gain: number) {
    const newBalance = this.lastKnownBalance + gain;
    this.lastKnownBalance = newBalance;
    
    if (newBalance > this.highestBalance) {
      this.highestBalance = newBalance;
    }
    
    this.todaysGains += Math.max(0, gain);
    
    // Notify all subscribers
    this.notifySubscribers();
    
    return newBalance;
  }
  
  // Reset balance to zero (for withdrawals)
  resetBalance() {
    this.lastKnownBalance = 0;
    this.highestBalance = 0;
    
    // Notify all subscribers
    this.notifySubscribers();
    
    return 0;
  }
  
  // Reset daily counters at midnight
  resetDailyCounters() {
    this.todaysGains = 0;
  }
  
  // Get current balance
  getCurrentBalance() {
    return this.lastKnownBalance;
  }
  
  // Get highest ever recorded balance
  getHighestBalance() {
    return this.highestBalance;
  }
  
  // Get today's total gains
  getTodaysGains() {
    return this.todaysGains;
  }
  
  // Subscribe to balance changes
  subscribe(callback: (state: any) => void) {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  // Notify all subscribers of state change
  private notifySubscribers() {
    const state = {
      lastKnownBalance: this.lastKnownBalance,
      highestBalance: this.highestBalance,
      todaysGains: this.todaysGains,
      userId: this.userId
    };
    
    this.subscribers.forEach(callback => callback(state));
  }
}

// Create singleton instance
export const balanceManager = new BalanceManager();

// Helper function to get highest balance from multiple sources
export const getHighestBalance = () => {
  // Try to get from balanceManager first
  const managerBalance = balanceManager.getHighestBalance();
  
  // Try to get from localStorage
  let storedHighestBalance = 0;
  try {
    const stored = localStorage.getItem('highestBalance');
    if (stored) {
      storedHighestBalance = parseFloat(stored);
    }
  } catch (e) {
    console.error("Failed to read from localStorage:", e);
  }
  
  // Return the highest value
  return Math.max(managerBalance, storedHighestBalance);
};
