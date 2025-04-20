/**
 * Gestionnaire de solde centralisé pour l'application
 */

// Interface pour les observateurs
interface BalanceWatcher {
  (balance: number): void;
}

class BalanceManager {
  private currentBalance: number;
  private watchers: BalanceWatcher[] = [];
  private dailyGains: number = 0;
  private lastUpdateTimestamp: number = Date.now();
  
  constructor() {
    this.currentBalance = this.loadBalance();
    this.dailyGains = this.loadDailyGains();
    this.lastUpdateTimestamp = this.loadLastUpdateTimestamp();
    
    // Mise à jour des gains quotidiens au démarrage
    this.updateDailyGains();
  }
  
  /**
   * Charge le solde depuis le localStorage
   */
  private loadBalance(): number {
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      return storedBalance ? parseFloat(storedBalance) : 0;
    } catch (error) {
      console.error("Erreur lors du chargement du solde depuis le localStorage:", error);
      return 0;
    }
  }
  
  /**
   * Charge les gains quotidiens depuis le localStorage
   */
  private loadDailyGains(): number {
    try {
      const storedGains = localStorage.getItem('dailyGains');
      return storedGains ? parseFloat(storedGains) : 0;
    } catch (error) {
      console.error("Erreur lors du chargement des gains quotidiens depuis le localStorage:", error);
      return 0;
    }
  }
  
  /**
   * Charge le timestamp de la dernière mise à jour depuis le localStorage
   */
  private loadLastUpdateTimestamp(): number {
    try {
      const storedTimestamp = localStorage.getItem('lastBalanceUpdate');
      return storedTimestamp ? parseInt(storedTimestamp, 10) : Date.now();
    } catch (error) {
      console.error("Erreur lors du chargement du timestamp depuis le localStorage:", error);
      return Date.now();
    }
  }
  
  /**
   * Sauvegarde le solde dans le localStorage
   */
  private saveBalance(): void {
    try {
      localStorage.setItem('currentBalance', this.currentBalance.toString());
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du solde dans le localStorage:", error);
    }
  }
  
  /**
   * Sauvegarde les gains quotidiens dans le localStorage
   */
  private saveDailyGains(): void {
    try {
      localStorage.setItem('dailyGains', this.dailyGains.toString());
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des gains quotidiens dans le localStorage:", error);
    }
  }
  
  /**
   * Sauvegarde le timestamp de la dernière mise à jour dans le localStorage
   */
  private saveLastUpdateTimestamp(): void {
    try {
      localStorage.setItem('lastBalanceUpdate', this.lastUpdateTimestamp.toString());
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du timestamp dans le localStorage:", error);
    }
  }
  
  /**
   * Retourne le solde actuel
   */
  getCurrentBalance(): number {
    return this.currentBalance;
  }
  
  /**
   * Force la synchronisation du solde
   */
  forceBalanceSync(newBalance: number): void {
    this.currentBalance = newBalance;
    this.saveBalance();
    this.notifyWatchers();
  }
  
  /**
   * Met à jour le solde et notifie les observateurs
   */
  updateBalance(gain: number): void {
    this.currentBalance += gain;
    this.saveBalance();
    this.notifyWatchers();
  }
  
  /**
   * Ajoute un observateur
   */
  addWatcher(watcher: BalanceWatcher): () => void {
    this.watchers.push(watcher);
    
    // Retourne une fonction pour supprimer l'observateur
    return () => {
      this.watchers = this.watchers.filter(w => w !== watcher);
    };
  }
  
  /**
   * Notifie tous les observateurs du solde actuel
   */
  private notifyWatchers(): void {
    this.watchers.forEach(watcher => watcher(this.currentBalance));
  }
  
  /**
   * Ajoute un gain au total quotidien
   */
  addDailyGain(gain: number): void {
    if (isNaN(gain) || gain <= 0) return;
    
    this.dailyGains += gain;
    this.dailyGains = parseFloat(this.dailyGains.toFixed(2));
    this.saveDailyGains();
    
    // Déclencher un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
      detail: { gains: this.dailyGains } 
    }));
  }
  
  /**
   * Récupère le total des gains quotidiens
   */
  getDailyGains(): number {
    return this.dailyGains;
  }
  
  /**
   * Réinitialise les gains quotidiens
   */
  resetDailyGains(): void {
    this.dailyGains = 0;
    this.saveDailyGains();
    
    // Déclencher un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('dailyGains:reset'));
  }
  
  /**
   * Met à jour les gains quotidiens en vérifiant si un nouveau jour a commencé
   */
  updateDailyGains(): void {
    const now = new Date();
    const today = now.toDateString();
    const lastResetDate = localStorage.getItem('lastResetDate');
    
    if (lastResetDate !== today) {
      this.resetDailyGains();
      localStorage.setItem('lastResetDate', today);
    }
  }
}

const balanceManager = new BalanceManager();
export default balanceManager;
