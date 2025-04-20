
/**
 * Gestionnaire centralisé pour le solde utilisateur
 * Permet de gérer le solde sans dépendre uniquement des mises à jour de la base de données
 */

import { supabase } from '@/integrations/supabase/client';

class BalanceManager {
  private balance: number = 0;
  private dailyGains: number = 0;
  private dailyResetTimestamp: number = 0;
  private lastSyncTime: number = 0;
  private isInitialized: boolean = false;
  private growthFactor: number = 1 + (Math.random() * 0.2); // 1.0-1.2
  private watchers: ((balance: number) => void)[] = [];
  
  constructor() {
    this.loadPersistedBalance();
    this.setupDailyReset();
    
    // Log pour debugging
    console.log("[BalanceManager] Daily growth factor:", this.growthFactor);
  }
  
  /**
   * Initialiser le gestionnaire avec un solde connu
   */
  initialize(balance: number): void {
    if (!this.isInitialized || Math.abs(this.balance - balance) > 0.2) {
      this.balance = balance;
      this.isInitialized = true;
      
      // Persister
      try {
        localStorage.setItem('cachedBalance', balance.toString());
      } catch (e) {
        console.error("[BalanceManager] Error saving to localStorage:", e);
      }
      
      // Notifier les watchers
      this.notifyWatchers();
    }
  }
  
  /**
   * Mettre à jour le solde avec un gain
   */
  updateBalance(gain: number): void {
    if (isNaN(gain) || gain < 0) return;
    
    const oldBalance = this.balance;
    this.balance = parseFloat((this.balance + gain).toFixed(2));
    
    // Persister
    try {
      localStorage.setItem('cachedBalance', this.balance.toString());
      localStorage.setItem('lastBalanceUpdate', Date.now().toString());
    } catch (e) {
      console.error("[BalanceManager] Error saving to localStorage:", e);
    }
    
    // Notifier les watchers si changement significatif
    if (this.balance !== oldBalance) {
      this.notifyWatchers();
    }
  }
  
  /**
   * Ajouter un watcher pour les changements de solde
   */
  addWatcher(callback: (balance: number) => void): () => void {
    this.watchers.push(callback);
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }
  
  /**
   * Notifier tous les watchers
   */
  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      try {
        watcher(this.balance);
      } catch (e) {
        console.error("[BalanceManager] Error in watcher:", e);
      }
    }
  }
  
  /**
   * Forcer une synchronisation du solde
   */
  forceBalanceSync(balance: number): void {
    this.balance = balance;
    this.notifyWatchers();
    
    // Persister
    try {
      localStorage.setItem('cachedBalance', balance.toString());
      localStorage.setItem('lastBalanceUpdate', Date.now().toString());
    } catch (e) {
      console.error("[BalanceManager] Error saving to localStorage:", e);
    }
  }
  
  /**
   * Obtenir le solde actuel
   */
  getCurrentBalance(): number {
    return this.balance;
  }
  
  /**
   * Charger le solde depuis le localStorage
   */
  private loadPersistedBalance(): void {
    try {
      const cachedBalance = localStorage.getItem('cachedBalance');
      if (cachedBalance) {
        const parsedBalance = parseFloat(cachedBalance);
        if (!isNaN(parsedBalance)) {
          this.balance = parsedBalance;
          this.isInitialized = true;
          console.log("[BalanceManager] Loaded persisted balance:", this.balance);
        }
      }
      
      // Charger aussi les gains quotidiens
      const cachedDailyGains = localStorage.getItem('dailyGains');
      if (cachedDailyGains) {
        const parsedDailyGains = parseFloat(cachedDailyGains);
        if (!isNaN(parsedDailyGains)) {
          this.dailyGains = parsedDailyGains;
          console.log("[BalanceManager] Daily gains loaded:", this.dailyGains);
        }
      }
    } catch (e) {
      console.error("[BalanceManager] Error loading from localStorage:", e);
    }
  }
  
  /**
   * Synchroniser avec la base de données
   */
  async syncWithDatabase(): Promise<boolean> {
    try {
      // Limiter la fréquence des synchronisations
      const now = Date.now();
      if (now - this.lastSyncTime < 30000) { // Maximum une fois toutes les 30 secondes
        return false;
      }
      
      this.lastSyncTime = now;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Récupérer le solde depuis la base de données
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', user.id)
        .single();
        
      if (error || !data) return false;
      
      // Mettre à jour seulement si la différence est significative
      const dbBalance = parseFloat(data.balance);
      
      if (!isNaN(dbBalance) && Math.abs(dbBalance - this.balance) > 0.2) {
        // Utiliser la valeur la plus élevée (jamais réduire le solde de l'utilisateur)
        const newBalance = Math.max(dbBalance, this.balance);
        this.balance = newBalance;
        
        // Persister
        try {
          localStorage.setItem('cachedBalance', newBalance.toString());
          localStorage.setItem('lastBalanceUpdate', now.toString());
        } catch (e) {
          console.error("[BalanceManager] Error saving to localStorage:", e);
        }
        
        // Notifier les watchers
        this.notifyWatchers();
        
        return true;
      }
      
      return false;
    } catch (e) {
      console.error("[BalanceManager] Error syncing with database:", e);
      return false;
    }
  }
  
  /**
   * Configuration de la réinitialisation quotidienne
   */
  private setupDailyReset(): void {
    try {
      // Charger le timestamp de la dernière réinitialisation
      const lastResetStr = localStorage.getItem('lastDailyReset');
      if (lastResetStr) {
        this.dailyResetTimestamp = parseInt(lastResetStr, 10);
      }
      
      // Vérifier si une réinitialisation est nécessaire
      this.checkAndResetDaily();
      
      // Configurer une vérification périodique
      setInterval(() => {
        this.checkAndResetDaily();
      }, 300000); // Vérifier toutes les 5 minutes
    } catch (e) {
      console.error("[BalanceManager] Error setting up daily reset:", e);
    }
  }
  
  /**
   * Vérifier et effectuer la réinitialisation quotidienne si nécessaire
   */
  private checkAndResetDaily(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Si aucune réinitialisation ou si la dernière réinitialisation était avant aujourd'hui
    if (this.dailyResetTimestamp === 0 || this.dailyResetTimestamp < today.getTime()) {
      // Réinitialiser les gains quotidiens
      this.dailyGains = 0;
      
      // Mettre à jour le timestamp
      this.dailyResetTimestamp = today.getTime();
      
      // Persister
      try {
        localStorage.setItem('dailyGains', '0');
        localStorage.setItem('lastDailyReset', this.dailyResetTimestamp.toString());
      } catch (e) {
        console.error("[BalanceManager] Error saving reset to localStorage:", e);
      }
      
      // Calculer le temps restant jusqu'à la prochaine réinitialisation
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const minutesUntilReset = Math.floor((tomorrow.getTime() - now.getTime()) / (60 * 1000));
      console.log(`Prochaine réinitialisation dans ${minutesUntilReset} minutes`);
      
      // Notifier pour les mises à jour UI
      window.dispatchEvent(new CustomEvent('dailyGains:reset'));
    }
  }
  
  /**
   * Ajouter un gain aux gains quotidiens
   */
  addDailyGain(gain: number): void {
    if (isNaN(gain) || gain < 0) return;
    
    this.dailyGains = parseFloat((this.dailyGains + gain).toFixed(2));
    
    // Persister
    try {
      localStorage.setItem('dailyGains', this.dailyGains.toString());
    } catch (e) {
      console.error("[BalanceManager] Error saving daily gains to localStorage:", e);
    }
    
    // Notifier
    window.dispatchEvent(new CustomEvent('dailyGains:updated', {
      detail: { amount: this.dailyGains }
    }));
  }
  
  /**
   * Obtenir le total des gains quotidiens
   */
  getDailyGains(): number {
    return this.dailyGains;
  }
}

// Instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;
