import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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

  constructor() {
    // Initialiser avec localStorage si disponible
    this.loadFromStorage();
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
        // Si pas de highest mais balance existante, utiliser cette valeur
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
      }
    } catch (error) {
      console.error('Error saving balance to storage:', error);
    }
  }

  public updateBalance(newBalance: number): void {
    // Toujours utiliser la valeur la plus élevée pour éviter les régressions
    if (newBalance > this.currentBalance) {
      this.currentBalance = newBalance;
      
      if (newBalance > this.highestBalance) {
        this.highestBalance = newBalance;
      }
      
      this.saveToStorage();
      this.dispatchBalanceUpdateEvent(newBalance);
      
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
  
  // Added method to get current balance
  public getCurrentBalance(): number {
    return this.currentBalance;
  }

  public setUserId(userId: string): void {
    if (this.userId !== userId) {
      this.userId = userId;
      this.saveToStorage();
    }
  }
  
  // Added initialize method
  public initialize(balance: number, userId?: string): void {
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
  }
  
  // Added subscribe method
  public subscribe(callback: (state: BalanceState) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  // Added method to notify subscribers
  private notifySubscribers(): void {
    const state: BalanceState = {
      currentBalance: this.currentBalance,
      highestBalance: this.highestBalance,
      userId: this.userId,
      lastKnownBalance: this.currentBalance
    };
    
    this.subscribers.forEach(callback => callback(state));
  }

  public async syncWithDatabase(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      // Récupérer le solde actuel depuis la base de données
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', this.userId)
        .single();

      if (error) throw error;

      const dbBalance = data?.balance || 0;

      // Si notre solde local est plus élevé, mettre à jour la base de données
      if (this.currentBalance > dbBalance) {
        console.log(`Solde DB (${dbBalance}) inférieur au solde maximum stocké (${this.currentBalance}). Synchronisation...`);
        
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ balance: this.currentBalance })
          .eq('user_id', this.userId);

        if (updateError) throw updateError;
        
        console.log(`Solde mis à jour avec succès dans la base à ${this.currentBalance}`);
        return true;
      }

      // Si la DB a un solde plus élevé, mettre à jour notre cache local
      if (dbBalance > this.currentBalance) {
        console.log(`Solde DB (${dbBalance}) supérieur au solde local (${this.currentBalance}). Mise à jour locale...`);
        this.currentBalance = dbBalance;
        
        if (dbBalance > this.highestBalance) {
          this.highestBalance = dbBalance;
        }
        
        this.saveToStorage();
        this.dispatchBalanceUpdateEvent(dbBalance);
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
  
  // Add resetDailyCounters method
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
        detail: { balance }
      })
    );
  }

  private dispatchBalanceResetEvent(): void {
    window.dispatchEvent(new CustomEvent('balance:reset-complete'));
  }
}

// Créer une instance singleton
const balanceManager = new BalanceManagerClass();

// Export getHighestBalance function
export const getHighestBalance = (): number => {
  return balanceManager.getHighestBalance();
};

// Exporter aussi la classe pour compatibilité
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
  cleanupUserBalanceData: () => balanceManager.cleanupUserBalanceData()
};

export default balanceManager;
