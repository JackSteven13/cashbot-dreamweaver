
/**
 * Gestionnaire centralisé du solde et des limites quotidiennes
 * Permet une meilleure synchronisation des états à travers l'application
 */

interface BalanceWatcher {
  (newBalance: number): void;
}

class BalanceManager {
  private currentBalance: number;
  private dailyGains: number;
  private lastUpdateTime: number;
  private watchers: BalanceWatcher[];
  private userId: string | null;
  private highestRecordedBalance: number;
  
  constructor() {
    // Initialiser avec les valeurs stockées localement ou des valeurs par défaut
    this.currentBalance = this.getStoredBalance();
    this.dailyGains = this.getStoredDailyGains();
    this.lastUpdateTime = Date.now();
    this.watchers = [];
    this.userId = null;
    this.highestRecordedBalance = this.currentBalance;
    
    // Vérifier si nous devons réinitialiser les compteurs quotidiens
    this.checkDailyReset();
  }
  
  /**
   * Récupérer le solde stocké localement
   */
  private getStoredBalance(): number {
    try {
      const stored = localStorage.getItem('currentBalance');
      return stored ? parseFloat(stored) : 0;
    } catch (e) {
      console.error("Erreur lors de la récupération du solde:", e);
      return 0;
    }
  }
  
  /**
   * Récupérer les gains quotidiens stockés localement
   */
  private getStoredDailyGains(): number {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      const storedDate = localStorage.getItem('dailyGainsDate');
      
      // Si la date stockée n'est pas aujourd'hui, réinitialiser
      if (storedDate !== today) {
        localStorage.setItem('dailyGainsDate', today);
        localStorage.setItem('dailyGains', '0');
        return 0;
      }
      
      const stored = localStorage.getItem('dailyGains');
      return stored ? parseFloat(stored) : 0;
    } catch (e) {
      console.error("Erreur lors de la récupération des gains quotidiens:", e);
      return 0;
    }
  }
  
  /**
   * Vérifier si nous devons réinitialiser les compteurs quotidiens
   */
  private checkDailyReset(): void {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const storedDate = localStorage.getItem('dailyGainsDate');
    
    if (storedDate !== today) {
      console.log(`Réinitialisation des gains quotidiens: ${storedDate} -> ${today}`);
      localStorage.setItem('dailyGainsDate', today);
      localStorage.setItem('dailyGains', '0');
      this.dailyGains = 0;
    }
  }
  
  /**
   * Mettre à jour le solde
   */
  updateBalance(gain: number): void {
    this.checkDailyReset();
    
    const newBalance = parseFloat((this.currentBalance + gain).toFixed(2));
    this.currentBalance = newBalance;
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (newBalance > this.highestRecordedBalance) {
      this.highestRecordedBalance = newBalance;
    }
    
    try {
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', Date.now().toString());
    } catch (e) {
      console.error("Erreur lors de la mise à jour du solde:", e);
    }
    
    // Notifier tous les observateurs
    this.notifyWatchers();
  }
  
  /**
   * Récupérer le solde le plus élevé jamais atteint
   */
  getHighestBalance(): number {
    return this.highestRecordedBalance;
  }
  
  /**
   * Définir l'ID utilisateur pour le suivi
   */
  setUserId(userId: string): void {
    this.userId = userId;
    
    try {
      localStorage.setItem('currentUserId', userId);
    } catch (e) {
      console.error("Erreur lors de l'enregistrement de l'ID utilisateur:", e);
    }
  }
  
  /**
   * Nettoyer les données de solde d'un utilisateur
   */
  cleanupUserBalanceData(): void {
    console.log("Nettoyage des données utilisateur dans le gestionnaire de solde");
    this.currentBalance = 0;
    this.dailyGains = 0;
    this.highestRecordedBalance = 0;
    this.userId = null;
    
    try {
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('dailyGains');
      localStorage.removeItem('dailyGainsDate');
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('lastBalanceUpdateTime');
      localStorage.removeItem('lastKnownBalance');
    } catch (e) {
      console.error("Erreur lors du nettoyage des données de solde:", e);
    }
    
    // Notifier les observateurs du changement
    this.notifyWatchers();
  }
  
  /**
   * Force une mise à jour du solde à une valeur spécifique
   */
  forceBalanceSync(newBalance: number): void {
    if (isNaN(newBalance) || newBalance < 0) {
      console.error("Tentative de synchronisation avec une valeur invalide:", newBalance);
      return;
    }
    
    this.currentBalance = parseFloat(newBalance.toFixed(2));
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (newBalance > this.highestRecordedBalance) {
      this.highestRecordedBalance = newBalance;
    }
    
    try {
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', Date.now().toString());
    } catch (e) {
      console.error("Erreur lors de la synchronisation forcée du solde:", e);
    }
    
    // Notifier tous les observateurs
    this.notifyWatchers();
  }
  
  /**
   * Ajouter un gain quotidien
   */
  addDailyGain(gain: number): void {
    this.checkDailyReset();
    
    if (gain <= 0) return;
    
    const newDailyGains = parseFloat((this.dailyGains + gain).toFixed(2));
    this.dailyGains = newDailyGains;
    
    try {
      localStorage.setItem('dailyGains', newDailyGains.toString());
    } catch (e) {
      console.error("Erreur lors de l'ajout des gains quotidiens:", e);
    }
  }
  
  /**
   * Force une mise à jour des gains quotidiens à une valeur spécifique
   */
  setDailyGains(amount: number): void {
    if (isNaN(amount) || amount < 0) {
      console.error("Tentative de définition des gains quotidiens avec une valeur invalide:", amount);
      return;
    }
    
    this.dailyGains = parseFloat(amount.toFixed(2));
    
    try {
      localStorage.setItem('dailyGains', this.dailyGains.toString());
      localStorage.setItem('dailyGainsDate', new Date().toISOString().split('T')[0]);
    } catch (e) {
      console.error("Erreur lors de la définition des gains quotidiens:", e);
    }
  }
  
  /**
   * Récupérer le solde actuel
   */
  getCurrentBalance(): number {
    this.checkDailyReset();
    return this.currentBalance;
  }
  
  /**
   * Récupérer les gains quotidiens
   */
  getDailyGains(): number {
    this.checkDailyReset();
    return this.dailyGains;
  }
  
  /**
   * Ajouter un observateur pour être notifié des changements de solde
   */
  addWatcher(watcher: BalanceWatcher): () => void {
    this.watchers.push(watcher);
    
    // Retourner une fonction pour désinscrire l'observateur
    return () => {
      this.watchers = this.watchers.filter(w => w !== watcher);
    };
  }
  
  /**
   * Notifier tous les observateurs d'un changement de solde
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
  
  /**
   * Réinitialiser les gains quotidiens
   */
  resetDailyGains(): void {
    this.dailyGains = 0;
    
    try {
      localStorage.setItem('dailyGains', '0');
      localStorage.setItem('dailyGainsDate', new Date().toISOString().split('T')[0]);
    } catch (e) {
      console.error("Erreur lors de la réinitialisation des gains quotidiens:", e);
    }
  }
}

// Exporter une instance unique du gestionnaire
const balanceManager = new BalanceManager();
export default balanceManager;
