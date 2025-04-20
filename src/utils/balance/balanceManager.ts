
/**
 * Gestionnaire centralisé du solde utilisateur
 * Fournit une source unique de vérité pour le solde actuel de l'utilisateur
 */

type BalanceWatcher = (balance: number) => void;

class BalanceManager {
  private currentBalance: number = 0;
  private highestBalance: number = 0;
  private dailyGains: number = 0;
  private watchers: BalanceWatcher[] = [];
  private initialized: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Charge les valeurs depuis le stockage local
   */
  private loadFromStorage(): void {
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedDailyGains = localStorage.getItem('dailyGains');
      
      if (storedBalance) {
        this.currentBalance = parseFloat(storedBalance);
      }
      
      if (storedHighestBalance) {
        this.highestBalance = parseFloat(storedHighestBalance);
      } else {
        this.highestBalance = this.currentBalance;
      }
      
      if (storedDailyGains) {
        this.dailyGains = parseFloat(storedDailyGains);
      }
      
      this.initialized = true;
    } catch (e) {
      console.error("Erreur lors du chargement du solde:", e);
    }
  }

  /**
   * Enregistre les valeurs dans le stockage local
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      localStorage.setItem('highestBalance', this.highestBalance.toString());
      localStorage.setItem('dailyGains', this.dailyGains.toString());
    } catch (e) {
      console.error("Erreur lors de l'enregistrement du solde:", e);
    }
  }

  /**
   * Obtient le solde actuel
   */
  getCurrentBalance(): number {
    if (!this.initialized) {
      this.loadFromStorage();
    }
    return this.currentBalance;
  }

  /**
   * Obtient le solde le plus élevé jamais atteint
   */
  getHighestBalance(): number {
    if (!this.initialized) {
      this.loadFromStorage();
    }
    return this.highestBalance;
  }

  /**
   * Obtient les gains quotidiens
   */
  getDailyGains(): number {
    if (!this.initialized) {
      this.loadFromStorage();
    }
    return this.dailyGains;
  }

  /**
   * Met à jour le solde avec un nouveau gain
   */
  updateBalance(gain: number): void {
    const oldBalance = this.currentBalance;
    this.currentBalance = parseFloat((oldBalance + gain).toFixed(2));
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (this.currentBalance > this.highestBalance) {
      this.highestBalance = this.currentBalance;
    }
    
    this.saveToStorage();
    
    // Notifier les observateurs
    this.notifyWatchers();
  }

  /**
   * Force la synchronisation du solde avec une valeur externe
   */
  forceBalanceSync(balance: number): void {
    const parsedBalance = parseFloat(balance.toFixed(2));
    
    if (isNaN(parsedBalance)) {
      return;
    }
    
    this.currentBalance = parsedBalance;
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (parsedBalance > this.highestBalance) {
      this.highestBalance = parsedBalance;
    }
    
    this.saveToStorage();
    
    // Notifier les observateurs
    this.notifyWatchers();
  }

  /**
   * Ajoute un gain au total quotidien
   */
  addDailyGain(gain: number): void {
    if (isNaN(gain) || gain <= 0) return;
    
    this.dailyGains = parseFloat((this.dailyGains + gain).toFixed(2));
    this.saveToStorage();
    
    // Déclencher un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
      detail: { amount: this.dailyGains } 
    }));
  }

  /**
   * Réinitialise les gains quotidiens
   */
  resetDailyGains(): void {
    this.dailyGains = 0;
    this.saveToStorage();
    
    // Déclencher un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('dailyGains:reset'));
  }

  /**
   * Ajoute un observateur qui sera notifié des changements de solde
   */
  addWatcher(watcher: BalanceWatcher): () => void {
    this.watchers.push(watcher);
    
    // Retourner une fonction pour supprimer l'observateur
    return () => {
      this.watchers = this.watchers.filter(w => w !== watcher);
    };
  }

  /**
   * Notifie tous les observateurs d'un changement de solde
   */
  private notifyWatchers(): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(this.currentBalance);
      } catch (e) {
        console.error("Erreur lors de la notification d'un observateur:", e);
      }
    });
  }
}

// Exportation d'une instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;
