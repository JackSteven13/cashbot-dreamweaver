
/**
 * Balance Manager - Gère le solde et la synchronisation
 */

import { supabase } from '@/integrations/supabase/client';

class BalanceManager {
  private dailyGains: number;
  private lastKnownBalance: number;
  private highestBalance: number;
  private midnightResetTimer: NodeJS.Timeout | null;
  private syncLock: boolean;
  private dailyGainsKey: string;
  private lastResetDateKey: string;

  constructor() {
    this.dailyGains = 0;
    this.lastKnownBalance = 0;
    this.highestBalance = 0;
    this.midnightResetTimer = null;
    this.syncLock = false;
    this.dailyGainsKey = 'dailyGains';
    this.lastResetDateKey = 'lastBalanceResetDate';
    
    // Initialize from localStorage
    this.initializeFromStorage();
    
    // Auto-reset at midnight
    this.setupMidnightReset();
  }

  // Initialize values from localStorage
  private initializeFromStorage() {
    try {
      // Load daily gains
      const storedGains = localStorage.getItem(this.dailyGainsKey);
      if (storedGains) {
        this.dailyGains = parseFloat(storedGains);
      }
      
      // Check if we need to reset based on date
      const lastResetDate = localStorage.getItem(this.lastResetDateKey);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!lastResetDate || lastResetDate !== today) {
        // It's a new day, reset daily gains
        this.resetDailyGains();
        localStorage.setItem(this.lastResetDateKey, today);
      }
      
      // Get last known balance and highest balance
      const storedBalance = localStorage.getItem('lastKnownBalance');
      const storedHighestBalance = localStorage.getItem('highestBalance');
      
      if (storedBalance) {
        this.lastKnownBalance = parseFloat(storedBalance);
      }
      
      if (storedHighestBalance) {
        this.highestBalance = parseFloat(storedHighestBalance);
      } else {
        this.highestBalance = this.lastKnownBalance;
      }
    } catch (e) {
      console.error("Error initializing balance manager from storage:", e);
    }
  }

  // Set up midnight reset
  private setupMidnightReset() {
    // Clear any existing timer
    if (this.midnightResetTimer) {
      clearTimeout(this.midnightResetTimer);
    }
    
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0); // 00:01:00
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set timer to reset at midnight
    this.midnightResetTimer = setTimeout(() => {
      this.resetDailyGains();
      
      // Save reset date
      const newDay = new Date().toISOString().split('T')[0];
      localStorage.setItem(this.lastResetDateKey, newDay);
      
      // Set up next midnight reset
      this.setupMidnightReset();
      
      // Trigger event to notify components
      window.dispatchEvent(new CustomEvent('dailyGains:reset', {
        detail: { timestamp: Date.now() }
      }));
      
    }, timeUntilMidnight);
  }

  // GETTERS

  // Get current daily gains
  getDailyGains(): number {
    return this.dailyGains;
  }

  // Get last known balance
  getLastKnownBalance(): number {
    return this.lastKnownBalance;
  }
  
  // Get current balance (alias for getLastKnownBalance for compatibility)
  getCurrentBalance(): number {
    return this.lastKnownBalance;
  }
  
  // Get highest recorded balance
  getHighestBalance(): number {
    return this.highestBalance;
  }

  // ACTIONS

  // Add to daily gains and persist to localStorage
  addDailyGain(amount: number): number {
    if (isNaN(amount) || amount <= 0) return this.dailyGains;
    
    this.dailyGains += amount;
    
    try {
      // Save to localStorage
      localStorage.setItem(this.dailyGainsKey, this.dailyGains.toString());
      
      // Trigger event to notify components
      window.dispatchEvent(new CustomEvent('dailyGains:updated', {
        detail: { gains: this.dailyGains, added: amount }
      }));
    } catch (e) {
      console.error("Error saving daily gains to localStorage:", e);
    }
    
    return this.dailyGains;
  }

  // Reset daily gains
  resetDailyGains(): void {
    this.dailyGains = 0;
    
    try {
      localStorage.setItem(this.dailyGainsKey, '0');
      
      // Store the reset date
      localStorage.setItem(this.lastResetDateKey, new Date().toISOString().split('T')[0]);
      
      console.log("Daily gains reset to 0");
    } catch (e) {
      console.error("Error resetting daily gains:", e);
    }
  }
  
  // Reset all daily counters (alias for compatibility)
  resetDailyCounters(): void {
    this.resetDailyGains();
  }

  // Initialize balance with a specific value
  initialize(balance: number): void {
    if (isNaN(balance)) return;
    
    this.lastKnownBalance = balance;
    
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
    }
    
    try {
      localStorage.setItem('lastKnownBalance', this.lastKnownBalance.toString());
      localStorage.setItem('currentBalance', this.lastKnownBalance.toString());
      localStorage.setItem('highestBalance', this.highestBalance.toString());
      sessionStorage.setItem('currentBalance', this.lastKnownBalance.toString());
    } catch (e) {
      console.error("Error initializing balance:", e);
    }
  }

  // Update balance with a gain amount
  updateBalance(gain: number): number {
    if (isNaN(gain)) return this.lastKnownBalance;
    
    const newBalance = this.lastKnownBalance + gain;
    this.lastKnownBalance = newBalance;
    
    // Update highest balance if needed
    if (newBalance > this.highestBalance) {
      this.highestBalance = newBalance;
    }
    
    try {
      localStorage.setItem('lastKnownBalance', this.lastKnownBalance.toString());
      localStorage.setItem('currentBalance', this.lastKnownBalance.toString());
      localStorage.setItem('highestBalance', this.highestBalance.toString());
      sessionStorage.setItem('currentBalance', this.lastKnownBalance.toString());
      
      // Trigger event to notify components
      window.dispatchEvent(new CustomEvent('balance:local-update', {
        detail: { balance: this.lastKnownBalance }
      }));
    } catch (e) {
      console.error("Error updating balance:", e);
    }
    
    return newBalance;
  }

  // Force update balance to a specific value
  forceUpdate(newBalance: number): void {
    if (isNaN(newBalance)) return;
    
    this.lastKnownBalance = newBalance;
    
    // Update highest balance if needed
    if (newBalance > this.highestBalance) {
      this.highestBalance = newBalance;
    }
    
    try {
      localStorage.setItem('lastKnownBalance', this.lastKnownBalance.toString());
      localStorage.setItem('currentBalance', this.lastKnownBalance.toString());
      localStorage.setItem('highestBalance', this.highestBalance.toString());
      sessionStorage.setItem('currentBalance', this.lastKnownBalance.toString());
      
      // Trigger event to notify components
      window.dispatchEvent(new CustomEvent('balance:local-update', {
        detail: { balance: this.lastKnownBalance }
      }));
    } catch (e) {
      console.error("Error forcing balance update:", e);
    }
  }
  
  // Force balance sync (alias for compatibility)
  forceBalanceSync(newBalance: number): void {
    this.forceUpdate(newBalance);
  }

  // Add a transaction to the database and update balance
  async addTransaction(userId: string, gain: number, description: string): Promise<boolean> {
    if (!userId || isNaN(gain)) return false;
    
    try {
      // Add to daily gains
      if (gain > 0) {
        this.addDailyGain(gain);
      }
      
      // Update balance
      this.updateBalance(gain);
      
      // Add transaction to database
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          gain: gain,
          report: description,
          date: new Date().toISOString().split('T')[0]
        });
        
      if (error) {
        console.error("Error adding transaction:", error);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error("Error adding transaction:", e);
      return false;
    }
  }
  
  // Reset balance (for withdrawals)
  resetBalance(): void {
    // Store current balance before reset for reporting
    const previousBalance = this.lastKnownBalance;
    
    // Reset balance
    this.lastKnownBalance = 0;
    
    try {
      localStorage.setItem('lastKnownBalance', '0');
      localStorage.setItem('currentBalance', '0');
      sessionStorage.setItem('currentBalance', '0');
      // Do NOT reset highest balance - it's a historical record
      
      // Trigger event to notify components
      window.dispatchEvent(new CustomEvent('balance:reset-complete', {
        detail: { previousBalance }
      }));
    } catch (e) {
      console.error("Error resetting balance:", e);
    }
  }
  
  // Clean up user balance data on logout
  cleanupUserBalanceData(): void {
    try {
      // Clear all balance-related data
      localStorage.removeItem('lastKnownBalance');
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('lastBalanceUpdateTime');
      sessionStorage.removeItem('currentBalance');
      
      // Reset in-memory values
      this.lastKnownBalance = 0;
      this.dailyGains = 0;
      
      console.log("User balance data cleaned up");
    } catch (e) {
      console.error("Error cleaning up user balance data:", e);
    }
  }

  // Synchronize with database
  async syncWithDatabase(): Promise<boolean> {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    
    if (!userId || this.syncLock) return false;
    
    this.syncLock = true;
    
    try {
      // Get balance from database
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error getting balance from database:", error);
        this.syncLock = false;
        return false;
      }
      
      if (data) {
        const databaseBalance = parseFloat(data.balance.toString());
        
        // Use highest balance
        if (!isNaN(databaseBalance) && databaseBalance > this.lastKnownBalance) {
          this.forceUpdate(databaseBalance);
        } else if (this.lastKnownBalance > databaseBalance) {
          // Update database with local balance
          await supabase
            .from('user_balances')
            .update({ balance: this.lastKnownBalance })
            .eq('id', userId);
        }
      }
      
      this.syncLock = false;
      return true;
    } catch (e) {
      console.error("Error syncing with database:", e);
      this.syncLock = false;
      return false;
    }
  }
}

// Create and export singleton instance
const balanceManager = new BalanceManager();

export default balanceManager;

