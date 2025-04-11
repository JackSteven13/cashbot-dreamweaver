// Define the interface outside the class to avoid syntax errors and circular references
interface BalanceState {
  currentBalance: number;
  highestBalance: number;
  userId: string | null;
  lastKnownBalance: number;
}

class BalanceManagerClass {
  private currentBalance: number = 0;
  private highestBalance: number = 0;
  private userId: string | null = null;
  private initialized: boolean = false;
  private subscribers: Array<(state: BalanceState) => void> = [];
  private lastSyncTime: number = 0;
  private syncLock: boolean = false;

  constructor() {
    // Initialize with localStorage if available
    this.loadFromStorage();
    
    // Add periodic sync to ensure consistency
    setInterval(() => this.periodicSync(), 60000); // Every 60 seconds
  }

  private loadFromStorage(): void {
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedUserId = localStorage.getItem('lastActiveUserId');

      if (storedBalance) {
        this.currentBalance = parseFloat(storedBalance);
      }

      if (storedHighestBalance) {
        this.highestBalance = parseFloat(storedHighestBalance);
      } else if (storedBalance) {
        // If no highest but existing balance, use this value
        this.highestBalance = parseFloat(storedBalance);
      }

      if (storedUserId) {
        this.userId = storedUserId;
      }

      this.initialized = true;
      console.log(`BalanceManager initialized with balance: ${this.currentBalance}, highest: ${this.highestBalance}`);
    } catch (error) {
      console.error('Error loading balance from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      localStorage.setItem('highestBalance', this.highestBalance.toString());
      if (this.userId) {
        localStorage.setItem('lastActiveUserId', this.userId);
        // Also save with user-specific keys for better data isolation
        localStorage.setItem(`balance_${this.userId}`, this.currentBalance.toString());
        localStorage.setItem(`highestBalance_${this.userId}`, this.highestBalance.toString());
        localStorage.setItem('lastBalanceUpdateTime', Date.now().toString());
      }
    } catch (error) {
      console.error('Error saving balance to storage:', error);
    }
  }

  public updateBalance(newBalance: number): void {
    // Use the higher value to prevent regressions
    if (newBalance > this.currentBalance) {
      this.currentBalance = newBalance;
      
      if (newBalance > this.highestBalance) {
        this.highestBalance = newBalance;
      }
      
      this.saveToStorage();
      this.dispatchBalanceUpdateEvent(newBalance);
      
      // Sync with database immediately for important updates
      if (this.userId) {
        this.syncWithDatabase().catch(err => 
          console.error("Error syncing after balance update:", err)
        );
      }
      
      // Notify subscribers
      this.notifySubscribers();
    }
  }

  public getBalance(): number {
    return this.currentBalance;
  }

  public getHighestBalance(): number {
    return this.highestBalance;
  }
  
  public getCurrentBalance(): number {
    return this.currentBalance;
  }

  public setUserId(userId: string): void {
    if (this.userId !== userId) {
      const oldUserId = this.userId;
      this.userId = userId;
      this.saveToStorage();
      
      // Load user-specific data if available
      try {
        const userSpecificBalance = localStorage.getItem(`balance_${userId}`);
        const userSpecificHighest = localStorage.getItem(`highestBalance_${userId}`);
        
        if (userSpecificBalance) {
          const parsedBalance = parseFloat(userSpecificBalance);
          if (parsedBalance > this.currentBalance) {
            this.currentBalance = parsedBalance;
          }
        }
        
        if (userSpecificHighest) {
          const parsedHighest = parseFloat(userSpecificHighest);
          if (parsedHighest > this.highestBalance) {
            this.highestBalance = parsedHighest;
          }
        }
        
        // If user changed, sync to ensure we have the latest data
        if (oldUserId !== userId) {
          this.syncWithDatabase().catch(err => 
            console.error("Error syncing after user change:", err)
          );
        }
      } catch (error) {
        console.error("Error loading user-specific balance:", error);
      }
    }
  }
  
  public initialize(balance: number, userId?: string): void {
    // Always use the higher balance to prevent regressions
    if (balance > this.currentBalance) {
      this.currentBalance = balance;
      
      if (balance > this.highestBalance) {
        this.highestBalance = balance;
      }
    }
    
    if (userId) {
      this.userId = userId;
    }
    
    this.saveToStorage();
    this.notifySubscribers();
    
    // Initial sync with database after initialization
    if (this.userId) {
      this.syncWithDatabase().catch(err => 
        console.error("Error during initial sync:", err)
      );
    }
  }
  
  public subscribe(callback: (state: BalanceState) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  private notifySubscribers(): void {
    const state: BalanceState = {
      currentBalance: this.currentBalance,
      highestBalance: this.highestBalance,
      userId: this.userId,
      lastKnownBalance: this.currentBalance
    };
    
    this.subscribers.forEach(callback => callback(state));
  }

  private async periodicSync(): Promise<void> {
    // Don't sync too frequently or if another sync is in progress
    const now = Date.now();
    if (this.syncLock || now - this.lastSyncTime < 30000) {
      return;
    }
    
    if (this.userId) {
      this.syncLock = true;
      try {
        await this.syncWithDatabase();
        this.lastSyncTime = now;
      } catch (error) {
        console.error("Error during periodic sync:", error);
      } finally {
        this.syncLock = false;
      }
    }
  }

  public async syncWithDatabase(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      // Get current balance from database
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', this.userId)
        .single();

      if (error) throw error;

      const dbBalance = data?.balance || 0;

      // If our local balance is higher, update the database
      if (this.currentBalance > dbBalance) {
        console.log(`DB balance (${dbBalance}) is lower than stored balance (${this.currentBalance}). Syncing...`);
        
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ balance: this.currentBalance })
          .eq('id', this.userId);

        if (updateError) throw updateError;
        
        console.log(`Balance successfully updated in database to ${this.currentBalance}`);
        return true;
      }

      // If DB has a higher balance, update our local cache
      if (dbBalance > this.currentBalance) {
        console.log(`DB balance (${dbBalance}) is higher than local balance (${this.currentBalance}). Updating local...`);
        this.currentBalance = dbBalance;
        
        if (dbBalance > this.highestBalance) {
          this.highestBalance = dbBalance;
        }
        
        this.saveToStorage();
        this.dispatchBalanceUpdateEvent(dbBalance);
        this.notifySubscribers();
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error syncing balance with database:', error);
      return false;
    }
  }

  public async addTransaction(userId: string, gain: number, report: string): Promise<boolean> {
    try {
      // Get current date as YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          gain: gain,
          report: report,
          date: today
        });

      if (error) throw error;
      
      // Update local balance after transaction
      this.updateBalance(this.currentBalance + gain);
      
      // Trigger event to signal a new transaction was added
      window.dispatchEvent(new CustomEvent('transaction:added', {
        detail: { 
          userId, 
          gain, 
          report, 
          date: today 
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer la transaction. Veuillez réessayer.",
        variant: 'destructive'
      });
      return false;
    }
  }

  public resetBalance(): void {
    this.currentBalance = 0;
    this.saveToStorage();
    this.dispatchBalanceResetEvent();
    this.notifySubscribers();
  }
  
  public resetDailyCounters(): void {
    // This method only resets daily counters, not the actual balance
    localStorage.removeItem('todaySessionCount');
    localStorage.removeItem('lastAutoSessionDate');
    localStorage.removeItem('lastAutoSessionTime');
    
    // Dispatch an event to notify components
    window.dispatchEvent(new CustomEvent('dailyCounters:reset'));
  }

  public cleanupUserBalanceData(): void {
    this.currentBalance = 0;
    this.highestBalance = 0;
    this.saveToStorage();
    this.dispatchBalanceResetEvent();
    this.notifySubscribers();
  }

  private dispatchBalanceUpdateEvent(balance: number): void {
    window.dispatchEvent(
      new CustomEvent('balance:local-update', {
        detail: { 
          balance,
          userId: this.userId
        }
      })
    );
  }

  private dispatchBalanceResetEvent(): void {
    window.dispatchEvent(
      new CustomEvent('balance:reset-complete', {
        detail: {
          userId: this.userId
        }
      })
    );
  }

  // Nouvelle fonction pour forcer la mise à jour du solde
  public forceUpdate(newBalance: number): void {
    if (newBalance >= 0) {
      this.currentBalance = newBalance;
      
      if (newBalance > this.highestBalance) {
        this.highestBalance = newBalance;
      }
      
      this.saveToStorage();
      this.dispatchBalanceUpdateEvent(newBalance);
      this.notifySubscribers();
      
      // Sync with database immediately
      if (this.userId) {
        this.syncWithDatabase().catch(err => 
          console.error("Error syncing after force update:", err)
        );
      }
    }
  }
}

// Create singleton instance
const balanceManager = new BalanceManagerClass();

// Export getHighestBalance function
export const getHighestBalance = (): number => {
  return balanceManager.getHighestBalance();
};

// Also export the class for compatibility
export const BalanceManager = {
  updateBalance: (balance: number) => balanceManager.updateBalance(balance),
  getBalance: () => balanceManager.getBalance(),
  getHighestBalance: () => balanceManager.getHighestBalance(),
  getCurrentBalance: () => balanceManager.getCurrentBalance(),
  setUserId: (userId: string) => balanceManager.setUserId(userId),
  syncWithDatabase: () => balanceManager.syncWithDatabase(),
  addTransaction: (userId: string, gain: number, report: string) => balanceManager.addTransaction(userId, gain, report),
  resetBalance: () => balanceManager.resetBalance(),
  resetDailyCounters: () => balanceManager.resetDailyCounters(),
  initialize: (balance: number, userId?: string) => balanceManager.initialize(balance, userId),
  subscribe: (callback: (state: BalanceState) => void) => balanceManager.subscribe(callback),
  cleanupUserBalanceData: () => balanceManager.cleanupUserBalanceData(),
  // Ajouter la nouvelle méthode à l'objet exporté
  forceUpdate: (newBalance: number) => balanceManager.forceUpdate(newBalance)
};

export default balanceManager;
