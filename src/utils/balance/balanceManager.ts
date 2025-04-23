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
        
        // Notifier les watchers immédiatement du changement de solde
        this.notifyWatchers(this.currentBalance);
      }
      
      // Récupérer le solde maximum pour cet utilisateur
      const userHighestBalanceKey = `highest_balance_${userId}`;
      const storedHighestBalance = parseFloat(localStorage.getItem(userHighestBalanceKey) || '0');
      if (!isNaN(storedHighestBalance) && storedHighestBalance > 0) {
        this.highestBalance = storedHighestBalance;
      }
      
      // Assurer la persistance immédiate
      persistBalance(this.currentBalance, userId);
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
    
    // Persister le solde dans le localStorage
    persistBalance(this.currentBalance, this.userId);
    
    // Notifier les watchers
    this.notifyWatchers(this.currentBalance);
    
    return this.currentBalance;
  }
  
  /**
   * Ajouter un gain quotidien (sans modifier le solde)
   */
  addDailyGain(amount: number): void {
    if (isNaN(amount) || amount <= 0) {
      console.error("Tentative d'ajout d'un gain quotidien invalide:", amount);
      return;
    }
    
    this.dailyGains += amount;
    this.dailyGains = parseFloat(this.dailyGains.toFixed(2));
    localStorage.setItem('dailyGains', this.dailyGains.toString());
    
    console.log(`Gains quotidiens mis à jour: ${this.dailyGains}€`);
  }
  
  /**
   * Obtenir le solde actuel
   */
  getCurrentBalance(): number {
    return this.currentBalance;
  }
  
  /**
   * Obtenir le solde maximum atteint
   */
  getHighestBalance(): number {
    return this.highestBalance;
  }
  
  /**
   * Mettre à jour explicitement le solde maximum
   */
  updateHighestBalance(balance: number): void {
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      localStorage.setItem('highest_balance', this.highestBalance.toString());
      
      if (this.userId) {
        localStorage.setItem(`highest_balance_${this.userId}`, this.highestBalance.toString());
      }
    }
  }
  
  /**
   * Obtenir les gains quotidiens
   */
  getDailyGains(): number {
    return this.dailyGains;
  }
  
  /**
   * Définir explicitement les gains quotidiens
   */
  setDailyGains(amount: number): void {
    if (isNaN(amount) || amount < 0) {
      console.error("Tentative de définir des gains quotidiens invalides:", amount);
      return;
    }
    
    this.dailyGains = parseFloat(amount.toFixed(2));
    localStorage.setItem('dailyGains', this.dailyGains.toString());
    
    console.log(`Gains quotidiens définis à: ${this.dailyGains}€`);
  }
  
  /**
   * Forcer la synchronisation du solde
   */
  forceBalanceSync(newBalance: number, userId?: string): void {
    if (userId) {
      this.setUserId(userId);
    }
    
    if (isNaN(newBalance)) {
      console.error("Tentative de synchronisation du solde avec une valeur non numérique:", newBalance);
      return;
    }
    
    console.log(`Synchronisation forcée du solde: ${this.currentBalance}€ -> ${newBalance}€`);
    
    this.currentBalance = parseFloat(newBalance.toFixed(2));
    
    // Mettre à jour le solde maximum si nécessaire
    if (this.currentBalance > this.highestBalance) {
      this.highestBalance = this.currentBalance;
      localStorage.setItem('highest_balance', this.highestBalance.toString());
      
      if (this.userId) {
        localStorage.setItem(`highest_balance_${this.userId}`, this.highestBalance.toString());
      }
    }
    
    // Persister le solde dans le localStorage
    persistBalance(this.currentBalance, this.userId);
    
    // Notifier les watchers
    this.notifyWatchers(this.currentBalance);
    
    // Synchroniser avec les autres sources de stockage pour plus de fiabilité
    localStorage.setItem('currentBalance', this.currentBalance.toString());
    localStorage.setItem('lastKnownBalance', this.currentBalance.toString());
    sessionStorage.setItem('currentBalance', this.currentBalance.toString());
  }
  
  /**
   * Ajouter un watcher pour les changements de solde
   */
  addWatcher(callback: (newBalance: number) => void): () => void {
    this.watchers.push(callback);
    
    // Retourner une fonction pour supprimer le watcher
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }
  
  /**
   * Notifier tous les watchers d'un changement de solde
   */
  private notifyWatchers(newBalance: number): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(newBalance);
      } catch (e) {
        console.error("Erreur lors de la notification d'un watcher:", e);
      }
    });
  }
  
  /**
   * Vérifier si un changement de solde est significatif (pour les animations)
   */
  checkForSignificantBalanceChange(newBalance: number): boolean {
    const difference = Math.abs(newBalance - this.currentBalance);
    return difference > 0.01;
  }
}

// Exporter une instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;
