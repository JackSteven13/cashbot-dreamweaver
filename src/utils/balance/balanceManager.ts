
// Define the interface outside the class to avoid syntax errors and circular references
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface BalanceState {
  currentBalance: number;
  highestBalance: number;
  userId: string | null;
  lastKnownBalance: number;
  dailyGains: number; // Ajouter les gains quotidiens à l'état
}

class BalanceManagerClass {
  private currentBalance: number = 0;
  private highestBalance: number = 0;
  private userId: string | null = null;
  private initialized: boolean = false;
  private subscribers: Array<(state: BalanceState) => void> = [];
  private lastSyncTime: number = 0;
  private syncLock: boolean = false;
  private dailyGains: number = 0; // Pour suivre les gains quotidiens
  private dailyGainsDate: string = ''; // Pour réinitialiser les gains chaque jour

  constructor() {
    // Initialize with localStorage if available
    this.loadFromStorage();
    
    // Add periodic sync to ensure consistency
    setInterval(() => this.periodicSync(), 30000); // Every 30 seconds
    
    // Vérifier et réinitialiser les gains quotidiens à minuit
    this.checkAndResetDailyGains();
    setInterval(() => this.checkAndResetDailyGains(), 60000); // Vérifier chaque minute
  }

  private loadFromStorage(): void {
    try {
      // Charger l'ID utilisateur en premier pour charger les bonnes données
      const storedUserId = localStorage.getItem('lastActiveUserId');
      if (storedUserId) {
        this.userId = storedUserId;
      }
      
      // Charger les données spécifiques à l'utilisateur si disponibles
      if (this.userId) {
        const userBalance = localStorage.getItem(`balance_${this.userId}`);
        const userHighestBalance = localStorage.getItem(`highestBalance_${this.userId}`);
        const userDailyGains = localStorage.getItem(`dailyGains_${this.userId}`);
        const userDailyGainsDate = localStorage.getItem(`dailyGainsDate_${this.userId}`);
        
        if (userBalance) {
          this.currentBalance = parseFloat(userBalance);
        }
        
        if (userHighestBalance) {
          this.highestBalance = parseFloat(userHighestBalance);
        } else if (userBalance) {
          this.highestBalance = parseFloat(userBalance);
        }
        
        if (userDailyGains) {
          this.dailyGains = parseFloat(userDailyGains);
        }
        
        if (userDailyGainsDate) {
          this.dailyGainsDate = userDailyGainsDate;
        }
        
        console.log(`BalanceManager: Loaded user-specific data for ${this.userId}: balance=${this.currentBalance}, highest=${this.highestBalance}, daily=${this.dailyGains}`);
      } else {
        // Fallback to generic storage if no user ID
        const storedBalance = localStorage.getItem('currentBalance');
        const storedHighestBalance = localStorage.getItem('highestBalance');
        
        if (storedBalance) {
          this.currentBalance = parseFloat(storedBalance);
        }
        
        if (storedHighestBalance) {
          this.highestBalance = parseFloat(storedHighestBalance);
        } else if (storedBalance) {
          this.highestBalance = parseFloat(storedBalance);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error loading balance from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Toujours sauvegarder dans le stockage global comme fallback
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      localStorage.setItem('highestBalance', this.highestBalance.toString());
      
      // Si nous avons un ID utilisateur, enregistrer spécifiquement pour cet utilisateur
      if (this.userId) {
        localStorage.setItem('lastActiveUserId', this.userId);
        localStorage.setItem(`balance_${this.userId}`, this.currentBalance.toString());
        localStorage.setItem(`highestBalance_${this.userId}`, this.highestBalance.toString());
        localStorage.setItem(`dailyGains_${this.userId}`, this.dailyGains.toString());
        localStorage.setItem(`dailyGainsDate_${this.userId}`, this.dailyGainsDate);
        localStorage.setItem('lastBalanceUpdateTime', Date.now().toString());
      }
    } catch (error) {
      console.error('Error saving balance to storage:', error);
    }
  }

  public updateBalance(newBalance: number): void {
    // Si c'est un ajout, l'ajouter aux gains quotidiens
    const gain = newBalance - this.currentBalance;
    if (gain > 0) {
      this.addToDailyGains(gain);
    }
    
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

  // Ajouter un montant aux gains quotidiens
  private addToDailyGains(amount: number): void {
    // Vérifier si nous sommes sur un nouveau jour
    const today = new Date().toISOString().split('T')[0];
    if (this.dailyGainsDate !== today) {
      // Nouveau jour, réinitialiser les gains quotidiens
      this.dailyGains = amount;
      this.dailyGainsDate = today;
    } else {
      // Même jour, ajouter au cumul
      this.dailyGains += amount;
    }
    
    // Sauvegarder dans le localStorage
    if (this.userId) {
      localStorage.setItem(`dailyGains_${this.userId}`, this.dailyGains.toString());
      localStorage.setItem(`dailyGainsDate_${this.userId}`, this.dailyGainsDate);
    }
    
    console.log(`BalanceManager: Daily gains updated to ${this.dailyGains} for ${this.userId || 'unknown'}`);
    
    // Déclencher un événement pour la mise à jour des gains quotidiens
    window.dispatchEvent(new CustomEvent('dailyGains:updated', {
      detail: { 
        userId: this.userId,
        dailyGains: this.dailyGains,
        date: this.dailyGainsDate
      }
    }));
  }

  // Vérifier et réinitialiser les gains quotidiens à minuit
  private checkAndResetDailyGains(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.dailyGainsDate !== today && this.dailyGainsDate !== '') {
      console.log(`BalanceManager: Resetting daily gains. Old date: ${this.dailyGainsDate}, New date: ${today}`);
      this.dailyGains = 0;
      this.dailyGainsDate = today;
      
      // Sauvegarder dans le localStorage
      if (this.userId) {
        localStorage.setItem(`dailyGains_${this.userId}`, '0');
        localStorage.setItem(`dailyGainsDate_${this.userId}`, today);
      }
      
      // Déclencher un événement pour la réinitialisation des gains quotidiens
      window.dispatchEvent(new CustomEvent('dailyGains:reset', {
        detail: { 
          userId: this.userId,
          date: today
        }
      }));
      
      // Réactiver le bot automatiquement au début de la journée
      window.dispatchEvent(new CustomEvent('bot:status-change', {
        detail: { 
          userId: this.userId,
          active: true
        }
      }));
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
  
  public getDailyGains(): number {
    // Vérifier si les gains sont pour aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    if (this.dailyGainsDate !== today) {
      return 0; // Nouveau jour, pas encore de gains
    }
    return this.dailyGains;
  }

  public setUserId(userId: string): void {
    if (this.userId !== userId) {
      const oldUserId = this.userId;
      this.userId = userId;
      
      // Load user-specific data if available
      try {
        const userSpecificBalance = localStorage.getItem(`balance_${userId}`);
        const userSpecificHighest = localStorage.getItem(`highestBalance_${userId}`);
        const userDailyGains = localStorage.getItem(`dailyGains_${userId}`);
        const userDailyGainsDate = localStorage.getItem(`dailyGainsDate_${userId}`);
        
        // Réinitialiser d'abord
        this.currentBalance = 0;
        this.highestBalance = 0;
        this.dailyGains = 0;
        
        // Charger les données utilisateur
        if (userSpecificBalance) {
          this.currentBalance = parseFloat(userSpecificBalance);
        }
        
        if (userSpecificHighest) {
          this.highestBalance = parseFloat(userSpecificHighest);
        }
        
        if (userDailyGains) {
          this.dailyGains = parseFloat(userDailyGains);
        }
        
        if (userDailyGainsDate) {
          this.dailyGainsDate = userDailyGainsDate;
        } else {
          this.dailyGainsDate = new Date().toISOString().split('T')[0]; // Aujourd'hui
        }
        
        this.saveToStorage();
        console.log(`BalanceManager: Loaded data for user ${userId}: balance=${this.currentBalance}, highest=${this.highestBalance}, daily=${this.dailyGains}`);
        
        // If user changed, sync to ensure we have the latest data
        this.syncWithDatabase().catch(err => 
          console.error("Error syncing after user change:", err)
        );
        
        // Notifier les abonnés du changement d'utilisateur
        this.notifySubscribers();
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
      lastKnownBalance: this.currentBalance,
      dailyGains: this.dailyGains // Inclure les gains quotidiens
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
        .select('balance, daily_session_count')
        .eq('id', this.userId)
        .single();

      if (error) throw error;

      const dbBalance = data?.balance || 0;
      const dbDailyCount = data?.daily_session_count || 0;

      // If our local balance is higher, update the database
      if (this.currentBalance > dbBalance) {
        console.log(`DB balance (${dbBalance}) is lower than stored balance (${this.currentBalance}). Syncing...`);
        
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ 
            balance: this.currentBalance,
            daily_session_count: Math.ceil(this.dailyGains / 0.1) // Estimer le nombre de sessions basé sur les gains quotidiens
          })
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
      
      // Déclencher un événement global pour forcer le rafraîchissement des transactions
      window.dispatchEvent(new CustomEvent('transactions:refresh', {
        detail: { 
          userId
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
    // Réinitialiser les gains quotidiens
    const today = new Date().toISOString().split('T')[0];
    this.dailyGains = 0;
    this.dailyGainsDate = today;
    
    // Sauvegarder dans le localStorage
    if (this.userId) {
      localStorage.setItem(`dailyGains_${this.userId}`, '0');
      localStorage.setItem(`dailyGainsDate_${this.userId}`, today);
    }
    
    localStorage.removeItem('todaySessionCount');
    localStorage.removeItem('lastAutoSessionDate');
    localStorage.removeItem('lastAutoSessionTime');
    
    // Dispatch an event to notify components
    window.dispatchEvent(new CustomEvent('dailyCounters:reset', {
      detail: {
        userId: this.userId,
        date: today
      }
    }));
  }

  public cleanupUserBalanceData(): void {
    this.currentBalance = 0;
    this.highestBalance = 0;
    this.dailyGains = 0;
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

  // Méthode pour forcer la mise à jour du solde
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

// Exporter une fonction pour obtenir les gains quotidiens
export const getDailyGains = (): number => {
  return balanceManager.getDailyGains();
};

// Also export the class for compatibility
export const BalanceManager = {
  updateBalance: (balance: number) => balanceManager.updateBalance(balance),
  getBalance: () => balanceManager.getBalance(),
  getHighestBalance: () => balanceManager.getHighestBalance(),
  getCurrentBalance: () => balanceManager.getCurrentBalance(),
  getDailyGains: () => balanceManager.getDailyGains(),
  setUserId: (userId: string) => balanceManager.setUserId(userId),
  syncWithDatabase: () => balanceManager.syncWithDatabase(),
  addTransaction: (userId: string, gain: number, report: string) => balanceManager.addTransaction(userId, gain, report),
  resetBalance: () => balanceManager.resetBalance(),
  resetDailyCounters: () => balanceManager.resetDailyCounters(),
  initialize: (balance: number, userId?: string) => balanceManager.initialize(balance, userId),
  subscribe: (callback: (state: BalanceState) => void) => balanceManager.subscribe(callback),
  cleanupUserBalanceData: () => balanceManager.cleanupUserBalanceData(),
  forceUpdate: (newBalance: number) => balanceManager.forceUpdate(newBalance)
};

export default balanceManager;
