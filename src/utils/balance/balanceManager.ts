
/**
 * Gestionnaire centralisé pour le solde
 * Ce module permet de maintenir un solde cohérent entre les différentes parties de l'application
 */
type BalanceWatcher = (newBalance: number) => void;

class BalanceManager {
  private currentBalance: number = 0;
  private initialBalance: number = 0;
  private watchers: BalanceWatcher[] = [];
  private lastSyncTime: number = 0;
  private dailyGrowthFactor: number = 0;
  
  constructor() {
    this.loadPersistedBalance();
    this.calculateDailyGrowthFactor();
  }
  
  private loadPersistedBalance() {
    try {
      // Charger depuis le localStorage
      const storedBalance = localStorage.getItem('currentBalance') || 
                          localStorage.getItem('lastKnownBalance') ||
                          localStorage.getItem('highestBalance');
      
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance)) {
          this.currentBalance = parsedBalance;
          this.initialBalance = parsedBalance;
          console.log(`[BalanceManager] Loaded persisted balance: ${this.currentBalance}`);
        }
      }
    } catch (e) {
      console.error("[BalanceManager] Failed to load persisted balance:", e);
    }
  }
  
  private calculateDailyGrowthFactor() {
    // Calculer un facteur de croissance quotidien basé sur la date
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Valeur entre 1.01 et 1.05 basée sur le jour de l'année (facteur de croissance journalier)
    this.dailyGrowthFactor = 1.01 + (Math.sin(dayOfYear * 0.1) * 0.02);
    console.log(`[BalanceManager] Daily growth factor: ${this.dailyGrowthFactor}`);
    
    // Enregistrer la date du dernier calcul
    localStorage.setItem('lastGrowthFactorDate', now.toDateString());
  }
  
  public initialize(balance: number) {
    // Ne pas réinitialiser à une valeur inférieure
    if (balance >= this.currentBalance) {
      console.log(`[BalanceManager] Initializing balance to ${balance}`);
      this.currentBalance = balance;
      this.initialBalance = balance;
      
      // Notifier tous les observateurs
      this.notifyWatchers();
      
      // Mettre à jour le localStorage
      this.persistBalance();
    } else {
      console.log(`[BalanceManager] Ignoring lower initialization value: ${balance} < ${this.currentBalance}`);
    }
  }
  
  public getCurrentBalance(): number {
    // Vérifier si nous devons appliquer la croissance journalière
    this.checkDailyGrowth();
    return this.currentBalance;
  }
  
  public updateBalance(amount: number): number {
    // Vérifier si nous devons appliquer la croissance journalière
    this.checkDailyGrowth();
    
    // Mettre à jour le solde
    if (amount > 0) {
      this.currentBalance += amount;
      console.log(`[BalanceManager] Balance updated: +${amount}, new balance: ${this.currentBalance}`);
    
      // Notifier tous les observateurs
      this.notifyWatchers();
      
      // Mettre à jour le localStorage
      this.persistBalance();
    }
    
    return this.currentBalance;
  }
  
  public syncWithServer(serverBalance: number) {
    const now = Date.now();
    
    // Éviter les synchronisations trop fréquentes
    if (now - this.lastSyncTime < 5000) {
      console.log("[BalanceManager] Skipping frequent sync request");
      return this.currentBalance;
    }
    
    this.lastSyncTime = now;
    console.log(`[BalanceManager] Syncing with server: server=${serverBalance}, local=${this.currentBalance}`);
    
    // Utiliser la valeur la plus élevée
    if (serverBalance > this.currentBalance) {
      this.currentBalance = serverBalance;
      this.notifyWatchers();
      this.persistBalance();
    }
    
    return this.currentBalance;
  }
  
  public forceBalanceSync(balance: number) {
    if (balance >= 0) {
      console.log(`[BalanceManager] Force syncing balance to ${balance}`);
      this.currentBalance = balance;
      this.notifyWatchers();
      this.persistBalance();
    }
    
    return this.currentBalance;
  }
  
  public resetBalance() {
    console.log("[BalanceManager] Resetting balance to 0");
    this.currentBalance = 0;
    this.initialBalance = 0;
    this.notifyWatchers();
    
    // Effacer également les valeurs du localStorage
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('highestBalance');
    
    return this.currentBalance;
  }
  
  private checkDailyGrowth() {
    const now = new Date();
    const lastGrowthDate = localStorage.getItem('lastGrowthFactorDate');
    
    // Si c'est un nouveau jour, appliquer la croissance
    if (lastGrowthDate !== now.toDateString() && this.currentBalance > 0) {
      console.log("[BalanceManager] Applying daily growth");
      
      // Recalculer le facteur de croissance
      this.calculateDailyGrowthFactor();
      
      // Appliquer la croissance (entre 1% et 5% par jour)
      const growth = this.currentBalance * (this.dailyGrowthFactor - 1);
      this.currentBalance *= this.dailyGrowthFactor;
      
      console.log(`[BalanceManager] Daily growth applied: +${growth.toFixed(2)}, new balance: ${this.currentBalance.toFixed(2)}`);
      
      // Notifier les observateurs
      this.notifyWatchers();
      
      // Mettre à jour le localStorage
      this.persistBalance();
      
      // Déclencher un événement pour montrer l'animation
      window.dispatchEvent(new CustomEvent('balance:daily-growth', { 
        detail: { growth, newBalance: this.currentBalance }
      }));
    }
  }
  
  public addWatcher(watcher: BalanceWatcher): () => void {
    this.watchers.push(watcher);
    
    // Retourner une fonction pour supprimer l'observateur
    return () => {
      this.watchers = this.watchers.filter(w => w !== watcher);
    };
  }
  
  private notifyWatchers() {
    this.watchers.forEach(watcher => {
      try {
        watcher(this.currentBalance);
      } catch (e) {
        console.error("[BalanceManager] Error notifying watcher:", e);
      }
    });
  }
  
  private persistBalance() {
    try {
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      localStorage.setItem('lastKnownBalance', this.currentBalance.toString());
      
      // Mettre à jour également la valeur maximale si nécessaire
      const highestBalance = localStorage.getItem('highestBalance');
      const parsedHighest = highestBalance ? parseFloat(highestBalance) : 0;
      
      if (this.currentBalance > parsedHighest) {
        localStorage.setItem('highestBalance', this.currentBalance.toString());
      }
    } catch (e) {
      console.error("[BalanceManager] Failed to persist balance:", e);
    }
  }
}

// Singleton
const balanceManager = new BalanceManager();
export default balanceManager;
