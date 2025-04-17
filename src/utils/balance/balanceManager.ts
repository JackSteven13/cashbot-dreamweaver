
/**
 * Balance Manager - Gère le solde et la synchronisation
 */

import { supabase } from '@/integrations/supabase/client';

class BalanceManager {
  private dailyGains: number;
  private lastKnownBalance: number;
  private midnightResetTimer: NodeJS.Timeout | null;
  private syncLock: boolean;
  private dailyGainsKey: string;
  private lastResetDateKey: string;

  constructor() {
    this.dailyGains = 0;
    this.lastKnownBalance = 0;
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
      
      // Get last known balance
      const storedBalance = localStorage.getItem('lastKnownBalance');
      if (storedBalance) {
        this.lastKnownBalance = parseFloat(storedBalance);
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

  // ACTIONS

  // Add to daily gains and persist to localStorage
  addDailyGain(amount: number): void {
    if (isNaN(amount) || amount <= 0) return;
    
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

  // Force update balance to a specific value
  forceUpdate(newBalance: number): void {
    if (isNaN(newBalance)) return;
    
    this.lastKnownBalance = newBalance;
    
    try {
      localStorage.setItem('lastKnownBalance', this.lastKnownBalance.toString());
      localStorage.setItem('currentBalance', this.lastKnownBalance.toString());
      sessionStorage.setItem('currentBalance', this.lastKnownBalance.toString());
      
      // Trigger event to notify components
      window.dispatchEvent(new CustomEvent('balance:local-update', {
        detail: { balance: this.lastKnownBalance }
      }));
    } catch (e) {
      console.error("Error forcing balance update:", e);
    }
  }

  // Add a transaction to the database and update balance
  async addTransaction(userId: string, gain: number, description: string): Promise<boolean> {
    if (!userId || isNaN(gain)) return false;
    
    try {
      // Add to daily gains
      if (gain > 0) {
        this.addDailyGain(gain);
      }
      
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
      
      // Update last known balance
      this.lastKnownBalance += gain;
      localStorage.setItem('lastKnownBalance', this.lastKnownBalance.toString());
      
      return true;
    } catch (e) {
      console.error("Error adding transaction:", e);
      return false;
    }
  }

  // Synchronize with database
  async syncWithDatabase(): Promise<boolean> {
    const userId = supabase.auth.getUser().then(({ data }) => data.user?.id);
    
    if (!userId || this.syncLock) return false;
    
    this.syncLock = true;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        this.syncLock = false;
        return false;
      }
      
      // Get balance from database
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Error getting balance from database:", error);
        this.syncLock = false;
        return false;
      }
      
      if (data) {
        const databaseBalance = parseFloat(data.balance);
        
        // Use highest balance
        if (!isNaN(databaseBalance) && databaseBalance > this.lastKnownBalance) {
          this.forceUpdate(databaseBalance);
        } else if (this.lastKnownBalance > databaseBalance) {
          // Update database with local balance
          await supabase
            .from('user_balances')
            .update({ balance: this.lastKnownBalance })
            .eq('id', user.id);
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
