
// Utility for managing user balance across the app
import { persistBalance, getPersistedBalance } from './balanceStorage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private highestBalance: number = 0;
  private userId: string | null = null;
  private watchers: Array<(newBalance: number) => void> = [];
  private lastSyncTimestamp: number = 0;
  private recoveryMode: boolean = false;
  private recoveryAttempts: number = 0;
  private maxRecoveryAttempts: number = 3;
  private lastRecoveryTime: number = 0;
  
  constructor() {
    // Initialize with persisted balance
    this.currentBalance = getPersistedBalance(this.userId);
    
    // Try to get daily gains from localStorage
    try {
      const storedDailyGains = localStorage.getItem(this.userId ? `dailyGains_${this.userId}` : 'dailyGains');
      if (storedDailyGains !== null) {
        this.dailyGains = parseFloat(storedDailyGains);
      }
    } catch (e) {
      console.error('Failed to load daily gains:', e);
    }
    
    // Try to get highest balance from localStorage
    try {
      const storedHighestBalance = localStorage.getItem(this.userId ? `highest_balance_${this.userId}` : 'highest_balance');
      if (storedHighestBalance !== null) {
        this.highestBalance = parseFloat(storedHighestBalance);
      }
    } catch (e) {
      console.error('Failed to load highest balance:', e);
    }
    
    console.log(`BalanceManager initialized with balance: ${this.currentBalance}, daily gains: ${this.dailyGains}`);
    
    // Setup event listener for database sync events
    window.addEventListener('db:balance-updated', ((event: CustomEvent) => {
      if (event.detail && typeof event.detail.newBalance === 'number') {
        // Only update if the DB value is higher or if it's a forced update
        const dbBalance = event.detail.newBalance;
        if (dbBalance > this.currentBalance || event.detail.force) {
          console.log(`Updating balance from DB sync: ${this.currentBalance} -> ${dbBalance}`);
          this.forceBalanceSync(dbBalance);
        }
      }
    }) as EventListener);
    
    // Setup event listener for balance force updates
    window.addEventListener('balance:force-update', ((event: CustomEvent) => {
      if (event.detail && typeof event.detail.newBalance === 'number') {
        const newBalance = event.detail.newBalance;
        console.log(`Force updating balance: ${this.currentBalance} -> ${newBalance}`);
        this.forceBalanceSync(newBalance, event.detail.userId || this.userId);
      }
    }) as EventListener);
    
    // Add event listener for automatic recovery on page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (this.userId && this.currentBalance <= 0) {
          console.log("Auto-recovery check on page load");
          this.recoverBalanceFromDatabase(this.userId);
        }
      }, 2000);
    });
    
    // Add event listener for session storage changes (for multi-tab coordination)
    window.addEventListener('storage', (event) => {
      if (event.key === 'balance_recovery_needed' && event.newValue === 'true') {
        console.log("Balance recovery requested from another tab");
        if (this.userId) {
          this.recoverBalanceFromDatabase(this.userId);
        }
        localStorage.removeItem('balance_recovery_needed');
      }
    });
  }
  
  setUserId(userId: string | null): void {
    if (this.userId !== userId) {
      this.userId = userId;
      // Reload balance for this user
      this.currentBalance = getPersistedBalance(userId);
      
      // Reload daily gains
      try {
        const storedDailyGains = localStorage.getItem(userId ? `dailyGains_${userId}` : 'dailyGains');
        if (storedDailyGains !== null) {
          this.dailyGains = parseFloat(storedDailyGains);
        } else {
          this.dailyGains = 0;
        }
      } catch (e) {
        console.error('Failed to load daily gains:', e);
        this.dailyGains = 0;
      }
      
      console.log(`User ID set to ${userId}, balance: ${this.currentBalance}, daily gains: ${this.dailyGains}`);
      
      // Check for balance recovery automatically when setting user ID
      if (userId && this.currentBalance <= 0) {
        this.recoverBalanceFromDatabase(userId);
      }
    }
  }

  getCurrentBalance(): number {
    // If we have a valid cached balance, return it
    if (!isNaN(this.currentBalance) && this.currentBalance > 0) {
      return this.currentBalance;
    }
    
    // Otherwise check local storage
    const persistedBalance = getPersistedBalance(this.userId);
    
    // If persisted balance is zero or invalid but we have a user ID, try to recover from DB
    if ((persistedBalance <= 0 || isNaN(persistedBalance)) && this.userId && !this.recoveryMode) {
      this.recoverBalanceFromDatabase(this.userId);
    }
    
    this.currentBalance = persistedBalance;
    return persistedBalance;
  }
  
  // Méthode améliorée pour récupérer le solde depuis la base de données
  async recoverBalanceFromDatabase(userId: string): Promise<void> {
    // Éviter les appels récursifs infinis et les tentatives trop fréquentes
    if (this.recoveryMode) return;
    
    // Limiter les tentatives de récupération 
    const now = Date.now();
    if (now - this.lastRecoveryTime < 10000) { // Pas plus d'une tentative toutes les 10 secondes
      console.log("Tentative de récupération trop fréquente, ignorée");
      return;
    }
    
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      console.log(`Nombre maximal de tentatives de récupération atteint (${this.maxRecoveryAttempts})`);
      this.recoveryAttempts = 0; // Réinitialiser pour permettre de nouvelles tentatives plus tard
      return;
    }
    
    this.recoveryMode = true;
    this.lastRecoveryTime = now;
    this.recoveryAttempts++;
    
    try {
      console.log("Tentative de récupération du solde depuis la base de données");
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance, subscription')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Erreur récupération solde:", error);
        return;
      }
      
      if (data && data.balance !== null) {
        // Vérifier si le solde récupéré est supérieur à zéro
        if (data.balance > 0) {
          console.log(`Solde récupéré depuis la DB: ${data.balance}€`);
          this.forceBalanceSync(data.balance, userId);
          
          // Déclencher un événement pour mettre à jour l'interface
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: {
              newBalance: data.balance,
              userId,
              recovered: true
            }
          }));
          
          // Notifier l'utilisateur du succès de la récupération
          toast({
            title: "Solde récupéré",
            description: `Votre solde de ${data.balance.toFixed(2)}€ a été récupéré avec succès.`,
            variant: "default"
          });
          
          // Mettre à jour également la souscription si disponible
          if (data.subscription) {
            localStorage.setItem('subscription', data.subscription);
            localStorage.setItem(`subscription_${userId}`, data.subscription);
          }
        } else {
          console.log("Le solde de la base de données est également à zéro ou négatif");
          
          // Rechercher d'anciennes transactions pour déterminer s'il y avait un solde précédent
          this.recoverFromTransactions(userId);
        }
      } else {
        console.log("Aucune donnée de solde trouvée dans la base de données");
      }
    } catch (err) {
      console.error("Erreur récupération solde:", err);
    } finally {
      this.recoveryMode = false;
    }
  }
  
  // Nouvelle méthode pour tenter de récupérer le solde à partir de l'historique des transactions
  async recoverFromTransactions(userId: string): Promise<void> {
    try {
      console.log("Tentative de récupération du solde à partir des transactions");
      
      // Récupérer les transactions des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('gain')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Erreur récupération transactions:", error);
        return;
      }
      
      if (data && data.length > 0) {
        // Calculer le solde basé sur les transactions
        const calculatedBalance = data.reduce((sum, tx) => sum + (tx.gain || 0), 0);
        
        if (calculatedBalance > 0) {
          console.log(`Solde reconstitué à partir des transactions: ${calculatedBalance}€`);
          
          // Mettre à jour le solde dans la base de données
          const { error: updateError } = await supabase
            .from('user_balances')
            .update({ balance: calculatedBalance })
            .eq('id', userId);
            
          if (updateError) {
            console.error("Erreur mise à jour solde:", updateError);
            return;
          }
          
          // Forcer la synchronisation locale
          this.forceBalanceSync(calculatedBalance, userId);
          
          // Déclencher un événement pour mettre à jour l'interface
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: {
              newBalance: calculatedBalance,
              userId,
              recovered: true
            }
          }));
          
          // Notifier l'utilisateur
          toast({
            title: "Solde reconstitué",
            description: `Votre solde de ${calculatedBalance.toFixed(2)}€ a été reconstitué à partir de vos transactions récentes.`,
            variant: "default"
          });
        } else {
          console.log("Impossible de reconstituer un solde positif à partir des transactions");
        }
      } else {
        console.log("Aucune transaction récente trouvée pour reconstituer le solde");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération depuis les transactions:", err);
    }
  }
  
  updateBalance(amount: number): number {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to updateBalance:', amount);
      return this.currentBalance;
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance += amount;
    
    // Persist the updated balance
    persistBalance(this.currentBalance, this.userId);
    
    // Update highest balance if needed
    this.updateHighestBalance(this.currentBalance);
    
    // Notify watchers
    this.notifyWatchers();
    
    // Set the last sync timestamp
    this.lastSyncTimestamp = Date.now();
    
    console.log(`Balance updated: ${oldBalance} -> ${this.currentBalance} (${amount > 0 ? '+' : ''}${amount})`);
    
    return this.currentBalance;
  }
  
  forceBalanceSync(newBalance: number, userId: string | null = null): void {
    if (userId !== null && userId !== this.userId) {
      this.setUserId(userId);
    }
    
    if (isNaN(newBalance)) {
      console.error('Invalid balance provided to forceBalanceSync:', newBalance);
      return;
    }
    
    const oldBalance = this.currentBalance;
    
    // Only update if the new balance is greater or we haven't synced recently (prevent flickering)
    if (newBalance > oldBalance || Date.now() - this.lastSyncTimestamp > 5000) {
      this.currentBalance = newBalance;
      
      // Persist the balance locally
      persistBalance(this.currentBalance, this.userId);
      
      // Update highest balance if needed
      this.updateHighestBalance(this.currentBalance);
      
      // Notify watchers if there's a change
      if (oldBalance !== newBalance) {
        console.log(`Balance force synced: ${oldBalance} -> ${newBalance}`);
        this.notifyWatchers();
      }
      
      // Update last sync timestamp
      this.lastSyncTimestamp = Date.now();
    } else {
      console.log(`Ignoring DB sync with lower balance: DB=${newBalance}, Local=${oldBalance}`);
    }
  }
  
  // Daily gains tracking
  getDailyGains(): number {
    return this.dailyGains;
  }
  
  setDailyGains(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to setDailyGains:', amount);
      return;
    }
    
    this.dailyGains = amount;
    
    // Persist in localStorage
    try {
      localStorage.setItem(this.userId ? `dailyGains_${this.userId}` : 'dailyGains', amount.toString());
      console.log(`Daily gains set to ${amount}`);
    } catch (e) {
      console.error('Failed to store daily gains:', e);
    }
  }
  
  addDailyGain(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to addDailyGain:', amount);
      return;
    }
    
    this.dailyGains += amount;
    
    // Persist in localStorage
    try {
      localStorage.setItem(this.userId ? `dailyGains_${this.userId}` : 'dailyGains', this.dailyGains.toString());
      console.log(`Daily gains increased by ${amount} to ${this.dailyGains}`);
    } catch (e) {
      console.error('Failed to store daily gains:', e);
    }
  }
  
  // Highest balance tracking
  getHighestBalance(): number {
    return this.highestBalance;
  }
  
  updateHighestBalance(balance: number): void {
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      
      // Persist in localStorage
      try {
        localStorage.setItem(this.userId ? `highest_balance_${this.userId}` : 'highest_balance', balance.toString());
      } catch (e) {
        console.error('Failed to store highest balance:', e);
      }
    }
  }
  
  // Watch for changes
  addWatcher(callback: (newBalance: number) => void): () => void {
    this.watchers.push(callback);
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }
  
  // Check for significant balance change
  checkForSignificantBalanceChange(newBalance: number): boolean {
    // Significant is defined as more than 1% difference
    const threshold = Math.max(this.currentBalance * 0.01, 0.01);
    return Math.abs(newBalance - this.currentBalance) > threshold;
  }
  
  // Méthode pour demander une récupération manuelle du solde
  requestBalanceRecovery(): void {
    if (!this.userId) {
      console.error("Impossible de récupérer le solde: ID utilisateur manquant");
      return;
    }
    
    // Réinitialiser le compteur de tentatives pour permettre une nouvelle tentative
    this.recoveryAttempts = 0;
    this.recoverBalanceFromDatabase(this.userId);
    
    // Signaler aux autres onglets qu'une récupération est nécessaire
    localStorage.setItem('balance_recovery_needed', 'true');
  }
  
  private notifyWatchers(): void {
    this.watchers.forEach(callback => {
      try {
        callback(this.currentBalance);
      } catch (e) {
        console.error('Error in balance watcher callback:', e);
      }
    });
  }
}

// Create a singleton instance
const balanceManager = new BalanceManager();

export default balanceManager;
