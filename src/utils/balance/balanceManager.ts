
import { supabase } from '@/integrations/supabase/client';

type BalanceSubscriber = (state: BalanceState) => void;

interface BalanceState {
  lastKnownBalance: number;
  highestBalance: number;
  userId?: string | null;
}

/**
 * BalanceManager - Gestionnaire central des opérations de solde utilisateur
 * Fournit des méthodes pour toutes les opérations liées au solde utilisateur
 */
export class BalanceManager {
  private userId: string | null = null;
  private currentBalance: number = 0;
  private highestBalance: number = 0;
  private subscription: string = 'freemium';
  private subscribers: BalanceSubscriber[] = [];
  private static instance: BalanceManager;

  constructor() {
    // Restore from localStorage if available
    this.loadFromLocalStorage();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): BalanceManager {
    if (!BalanceManager.instance) {
      BalanceManager.instance = new BalanceManager();
    }
    return BalanceManager.instance;
  }

  /**
   * Initialize with a specific balance value
   */
  public initialize(balance: number, userId?: string | null): void {
    // Only update if the new balance is higher than our current value
    if (balance > this.currentBalance) {
      this.currentBalance = balance;
      
      if (balance > this.highestBalance) {
        this.highestBalance = balance;
      }
      
      // Save highest balance to localStorage for persistence
      this.saveToLocalStorage();
    }
    
    if (userId) {
      this.userId = userId;
    }
    
    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Update the balance by adding/subtracting an amount
   */
  public updateBalance(amount: number): number {
    const newBalance = parseFloat((this.currentBalance + amount).toFixed(2));
    
    // Update the current balance
    this.currentBalance = newBalance;
    
    // Update highest balance if needed
    if (newBalance > this.highestBalance) {
      this.highestBalance = newBalance;
    }
    
    // Save to localStorage for persistence
    this.saveToLocalStorage();
    
    // Notify subscribers
    this.notifySubscribers();
    
    return this.currentBalance;
  }

  /**
   * Reset the balance to zero
   */
  public resetBalance(): void {
    this.currentBalance = 0;
    this.highestBalance = 0;
    
    // Clear localStorage
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('highestBalance');
    localStorage.removeItem('lastKnownBalance');
    
    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Record a transaction to the database
   */
  private async recordTransaction(userId: string, gain: number, report: string): Promise<void> {
    if (!userId) return;
    
    try {
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          gain: gain,
          report,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        });
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }

  /**
   * Get current balance
   */
  public getCurrentBalance(): number {
    return this.currentBalance;
  }

  /**
   * Get highest recorded balance
   */
  public getHighestBalance(): number {
    return this.highestBalance;
  }

  /**
   * Reset daily counters
   */
  public async resetDailyCounters(): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      const { error } = await supabase
        .from('user_balances')
        .update({ 
          daily_session_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.userId);

      return !error;
    } catch (error) {
      console.error('Error resetting daily counters:', error);
      return false;
    }
  }

  /**
   * Subscribe to balance changes
   */
  public subscribe(callback: BalanceSubscriber): () => void {
    this.subscribers.push(callback);
    
    // Call immediately with current state
    callback({
      lastKnownBalance: this.currentBalance,
      highestBalance: this.highestBalance,
      userId: this.userId
    });
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(): void {
    const state: BalanceState = {
      lastKnownBalance: this.currentBalance,
      highestBalance: this.highestBalance,
      userId: this.userId
    };
    
    this.subscribers.forEach(callback => callback(state));
  }

  /**
   * Save current state to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      localStorage.setItem('highestBalance', this.highestBalance.toString());
      localStorage.setItem('lastKnownBalance', this.currentBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      
      // Also save user-specific values if we have a userId
      if (this.userId) {
        localStorage.setItem(`user_balance_${this.userId}`, this.currentBalance.toString());
        localStorage.setItem(`highest_balance_${this.userId}`, this.highestBalance.toString());
      }
    } catch (e) {
      console.error('Failed to save balance to localStorage:', e);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      const storedHighestBalance = localStorage.getItem('highestBalance');
      
      if (storedBalance) {
        this.currentBalance = parseFloat(storedBalance);
      }
      
      if (storedHighestBalance) {
        this.highestBalance = parseFloat(storedHighestBalance);
      }
    } catch (e) {
      console.error('Failed to load balance from localStorage:', e);
    }
  }

  /**
   * Clean up user balance data on logout
   */
  public static cleanupUserBalanceData(userId?: string): void {
    // Reset any cached balance data in localStorage
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('highestBalance');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('lastBalanceUpdateTime');
    localStorage.removeItem('lastSessionTime');
    
    if (userId) {
      localStorage.removeItem(`user_balance_${userId}`);
      localStorage.removeItem(`highest_balance_${userId}`);
    }
    
    // Reset the singleton instance
    if (BalanceManager.instance) {
      BalanceManager.instance.currentBalance = 0;
      BalanceManager.instance.highestBalance = 0;
      BalanceManager.instance.userId = null;
    }
  }
}

// Create and export a singleton instance
export const balanceManager = BalanceManager.getInstance();

// Export helper functions for convenience
export const getHighestBalance = (): number => {
  return balanceManager.getHighestBalance();
};

// Also export class and instance for flexible usage
export default balanceManager;
