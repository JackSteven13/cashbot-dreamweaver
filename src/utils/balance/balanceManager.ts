
import { getPersistedBalance, persistBalance } from './balanceStorage';
import { BalanceWatcher } from './types';

/**
 * Gestionnaire centralisé pour le solde utilisateur
 */
class BalanceManager {
  private currentBalance: number = 0;
  private highestBalance: number = 0;
  private dailyGains: number = 0;
  private userId: string | null = null;
  private watchers: BalanceWatcher[] = [];

  constructor() {
    // Initialiser depuis le localStorage si disponible
    const storedBalance = parseFloat(localStorage.getItem('currentBalance') || '0');
    this.currentBalance = !isNaN(storedBalance) ? storedBalance : 0;
    
    // Récupérer les gains quotidiens
    const storedDailyGains = parseFloat(localStorage.getItem('dailyGains') || '0');
    this.dailyGains = !isNaN(storedDailyGains) ? storedDailyGains : 0;
    
    // Récupérer le solde le plus élevé
    const storedHighestBalance = parseFloat(localStorage.getItem('highest_balance') || '0');
    this.highestBalance = !isNaN(storedHighestBalance) ? storedHighestBalance : 0;
    
    console.log(`BalanceManager initialisé: solde=${this.currentBalance}, gains quotidiens=${this.dailyGains}, solde max=${this.highestBalance}`);
  }

  /**
   * Associer un ID utilisateur au gestionnaire de solde
   */
  setUserId(userId: string): void {
    if (userId !== this.userId) {
      console.log(`BalanceManager: changement d'utilisateur ${this.userId} -> ${userId}`);
      this.userId = userId;
      
      // Récupérer le solde spécifique à l'utilisateur
      const userBalance = getPersistedBalance(userId);
      if (userBalance > 0) {
        this.currentBalance = userBalance;
        console.log(`BalanceManager: solde chargé pour ${userId}: ${userBalance}€`);
      }
      
      // Récupérer le solde maximum pour cet utilisateur
      const userHighestBalanceKey = `highest_balance_${userId}`;
      const storedHighestBalance = parseFloat(localStorage.getItem(userHighestBalanceKey) || '0');
      if (!isNaN(storedHighestBalance) && storedHighestBalance > 0) {
        this.highestBalance = storedHighestBalance;
      }
    }
  }

  /**
   * Mettre à jour le solde
   */
  updateBalance(amount: number): number {
    if (isNaN(amount)) {
      console.error("Tentative de mise à jour du solde avec une valeur non numérique:", amount);
      return this.currentBalance;
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance += amount;
    
    // Arrondir à 2 décimales pour éviter les erreurs de précision
    this.currentBalance = parseFloat(this.currentBalance.toFixed(2));
    
    // Mettre à jour les gains quotidiens (uniquement les gains positifs)
    if (amount > 0) {
      this.dailyGains += amount;
      this.dailyGains = parseFloat(this.dailyGains.toFixed(2));
      localStorage.setItem('dailyGains', this.dailyGains.toString());
    }
    
    // Mettre à jour le solde maximum si nécessaire
    if (this.currentBalance > this.highestBalance) {
      this.highestBalance = this.currentBalance;
      localStorage.setItem('highest_balance', this.highestBalance.toString());
      if (this.userId) {
        localStorage.setItem(`highest_balance_${this.userId}`, this.highestBalance.toString());
      }
    }
    
    // Persister le solde
    if (this.userId) {
      persistBalance(this.currentBalance, this.userId);
    } else {
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      localStorage.setItem('lastKnownBalance', this.currentBalance.toString());
      localStorage.setItem('lastUpdatedBalance', this.currentBalance.toString());
      sessionStorage.setItem('currentBalance', this.currentBalance.toString());
    }
    
    console.log(`Solde mis à jour: ${oldBalance}€ + ${amount}€ = ${this.currentBalance}€ (Gains quotidiens: ${this.dailyGains}€)`);
    
    // Notifier tous les observateurs
    this.notifyWatchers();
    
    return this.currentBalance;
  }
  
  /**
   * Forcer la synchronisation du solde avec une valeur spécifique
   */
  forceBalanceSync(balance: number, userId?: string): void {
    if (isNaN(balance)) {
      console.error("Tentative de synchronisation forcée avec une valeur non numérique:", balance);
      return;
    }
    
    console.log(`Synchronisation forcée du solde à ${balance}€`);
    
    this.currentBalance = balance;
    
    // Mettre à jour le solde maximum si nécessaire
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      localStorage.setItem('highest_balance', this.highestBalance.toString());
      if (userId || this.userId) {
        localStorage.setItem(`highest_balance_${userId || this.userId}`, this.highestBalance.toString());
      }
    }
    
    // Persister le solde
    if (userId) {
      this.userId = userId;
      persistBalance(balance, userId);
    } else if (this.userId) {
      persistBalance(balance, this.userId);
    } else {
      localStorage.setItem('currentBalance', balance.toString());
      localStorage.setItem('lastKnownBalance', balance.toString());
      localStorage.setItem('lastUpdatedBalance', balance.toString());
      sessionStorage.setItem('currentBalance', balance.toString());
    }
    
    // Notifier tous les observateurs
    this.notifyWatchers();
  }

  /**
   * Récupérer le solde actuel
   */
  getCurrentBalance(): number {
    // Si nous avons un ID utilisateur, vérifier s'il y a une valeur plus récente
    if (this.userId) {
      const persistedBalance = getPersistedBalance(this.userId);
      if (persistedBalance > this.currentBalance) {
        console.log(`Mise à jour du solde depuis le stockage: ${this.currentBalance}€ -> ${persistedBalance}€`);
        this.currentBalance = persistedBalance;
        this.notifyWatchers();
      }
    }
    
    return this.currentBalance;
  }

  /**
   * Récupérer les gains quotidiens
   */
  getDailyGains(): number {
    return this.dailyGains;
  }

  /**
   * Définir les gains quotidiens
   */
  setDailyGains(gains: number): void {
    if (isNaN(gains)) {
      console.error("Tentative de définition des gains quotidiens avec une valeur non numérique:", gains);
      return;
    }
    
    this.dailyGains = gains;
    localStorage.setItem('dailyGains', gains.toString());
  }

  /**
   * Récupérer le solde maximum atteint
   */
  getHighestBalance(): number {
    // Si nous avons un ID utilisateur, vérifier le stockage spécifique
    if (this.userId) {
      const storedHighest = parseFloat(localStorage.getItem(`highest_balance_${this.userId}`) || '0');
      if (!isNaN(storedHighest) && storedHighest > this.highestBalance) {
        this.highestBalance = storedHighest;
      }
    }
    
    return this.highestBalance;
  }

  /**
   * Mettre à jour le solde maximum
   */
  updateHighestBalance(balance: number): void {
    if (isNaN(balance)) {
      console.error("Tentative de mise à jour du solde maximum avec une valeur non numérique:", balance);
      return;
    }
    
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      localStorage.setItem('highest_balance', balance.toString());
      
      if (this.userId) {
        localStorage.setItem(`highest_balance_${this.userId}`, balance.toString());
      }
    }
  }

  /**
   * Ajouter un observateur pour être notifié des changements de solde
   */
  addWatcher(callback: BalanceWatcher): () => void {
    this.watchers.push(callback);
    
    // Retourner une fonction pour supprimer l'observateur
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }

  /**
   * Notifier tous les observateurs d'un changement de solde
   */
  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      try {
        watcher(this.currentBalance);
      } catch (error) {
        console.error("Erreur lors de la notification d'un observateur:", error);
      }
    }
  }
}

// Exporter une instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;
