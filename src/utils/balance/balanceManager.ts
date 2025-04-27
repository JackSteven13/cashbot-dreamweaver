
/**
 * Gestionnaire centralisé du solde pour éviter les incohérences
 */

// Import subscription limits at the top of the file
import { SUBSCRIPTION_LIMITS } from '../subscription/constants';

// Singleton pour gérer l'état du solde
class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private highestBalance: number = 0;
  private lastUpdateTime: number = 0;
  private watchers: ((balance: number) => void)[] = [];
  private updateLock: boolean = false;
  private updateQueue: {amount: number, timestamp: number}[] = [];
  private userId: string | undefined = undefined;
  private persistentStateInitialized: boolean = false;

  constructor() {
    this.initFromStorage();
  }

  // Initialisation à partir du stockage local avec des clés spécifiques à l'utilisateur
  private initFromStorage(): void {
    try {
      const storedBalance = localStorage.getItem('lastKnownBalance') || localStorage.getItem('currentBalance');
      const storedHighestBalance = localStorage.getItem('highest_balance');
      const storedDailyGains = localStorage.getItem('dailyGains');
      const storedUserId = localStorage.getItem('currentUserId');
      
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance) && parsedBalance >= 0) {
          this.currentBalance = parsedBalance;
        }
      }
      
      if (storedHighestBalance) {
        const parsedHighest = parseFloat(storedHighestBalance);
        if (!isNaN(parsedHighest) && parsedHighest >= 0) {
          this.highestBalance = parsedHighest;
        }
      }
      
      if (storedDailyGains) {
        const parsedGains = parseFloat(storedDailyGains);
        if (!isNaN(parsedGains) && parsedGains >= 0) {
          this.dailyGains = parsedGains;
        }
      }
      
      if (storedUserId) {
        this.userId = storedUserId;
      }
      
      // Vérifier si nous avons besoin de réinitialiser les gains quotidiens (nouveau jour)
      this.checkForDayChange();
      
      this.persistentStateInitialized = true;
    } catch (e) {
      console.error("Erreur lors de l'initialisation du gestionnaire de solde:", e);
    }
  }
  
  // Définir l'ID utilisateur pour ce gestionnaire
  setUserId(userId: string): void {
    if (userId && userId !== this.userId) {
      this.userId = userId;
      localStorage.setItem('currentUserId', userId);
      
      // Recharger les données spécifiques à l'utilisateur si disponibles
      const userBalanceKey = `currentBalance_${userId}`;
      const userHighestBalanceKey = `highest_balance_${userId}`;
      
      const storedUserBalance = localStorage.getItem(userBalanceKey);
      const storedUserHighestBalance = localStorage.getItem(userHighestBalanceKey);
      
      if (storedUserBalance) {
        const parsedBalance = parseFloat(storedUserBalance);
        if (!isNaN(parsedBalance) && parsedBalance > 0) {
          this.currentBalance = parsedBalance;
        }
      }
      
      if (storedUserHighestBalance) {
        const parsedHighest = parseFloat(storedUserHighestBalance);
        if (!isNaN(parsedHighest) && parsedHighest > 0) {
          this.highestBalance = parsedHighest;
        }
      }
    }
  }
  
  // Vérifier si la journée a changé pour réinitialiser les gains quotidiens
  private checkForDayChange(): void {
    try {
      const lastGainDate = localStorage.getItem('lastGainDate');
      const today = new Date().toDateString();
      
      if (lastGainDate !== today) {
        console.log("Nouveau jour détecté - réinitialisation des gains quotidiens");
        this.dailyGains = 0;
        localStorage.setItem('dailyGains', '0');
        localStorage.setItem('lastGainDate', today);
      }
    } catch (e) {
      console.error("Erreur lors de la vérification du changement de jour:", e);
    }
  }

  // Obtenir le solde actuel
  getCurrentBalance(): number {
    return this.currentBalance;
  }

  // Obtenir le solde le plus élevé
  getHighestBalance(): number {
    return this.highestBalance;
  }

  // Obtenir les gains quotidiens
  getDailyGains(): number {
    return this.dailyGains;
  }
  
  // Définir les gains quotidiens (utilisé pour les synchronisations)
  setDailyGains(gains: number): void {
    if (isNaN(gains) || gains < 0) return;
    
    this.dailyGains = gains;
    localStorage.setItem('dailyGains', gains.toString());
    localStorage.setItem('lastGainDate', new Date().toDateString());
  }
  
  // Ajouter un gain quotidien
  addDailyGain(gain: number): void {
    if (isNaN(gain) || gain <= 0) return;
    
    // S'assurer que nous sommes synchronisés avec le bon jour
    this.checkForDayChange();
    
    const newDailyGains = this.dailyGains + gain;
    this.dailyGains = newDailyGains;
    localStorage.setItem('dailyGains', newDailyGains.toString());
    localStorage.setItem('lastGainDate', new Date().toDateString());
  }

  // Mettre à jour le solde avec verrouillage pour éviter les mises à jour simultanées
  updateBalance(amount: number): void {
    if (isNaN(amount)) return;
    
    // Si un verrouillage est actif, mettre la mise à jour en file d'attente
    if (this.updateLock) {
      this.updateQueue.push({amount, timestamp: Date.now()});
      return;
    }
    
    this.updateLock = true;
    
    try {
      const newBalance = parseFloat((this.currentBalance + amount).toFixed(2));
      
      // IMPORTANT: Ne jamais permettre au solde de diminuer sans raison
      if (newBalance < this.currentBalance && amount > 0) {
        console.error("Tentative de réduction du solde détectée et bloquée");
        this.updateLock = false;
        return;
      }
      
      this.currentBalance = newBalance;
      
      // Mettre à jour le solde le plus élevé si nécessaire
      if (newBalance > this.highestBalance) {
        this.highestBalance = newBalance;
        localStorage.setItem('highest_balance', newBalance.toString());
      }
      
      // Persistance dans le stockage local
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      localStorage.setItem('lastUpdatedBalance', newBalance.toString());
      sessionStorage.setItem('currentBalance', newBalance.toString());
      
      // Enregistrer l'horodatage de la dernière mise à jour
      this.lastUpdateTime = Date.now();
      localStorage.setItem('lastBalanceUpdateTime', this.lastUpdateTime.toString());
      
      // Notifier les observateurs du changement
      this.notifyWatchers();
    } finally {
      this.updateLock = false;
      
      // Traiter la file d'attente si nécessaire
      this.processUpdateQueue();
    }
  }
  
  // Traiter la file d'attente des mises à jour
  private processUpdateQueue(): void {
    if (this.updateQueue.length === 0) return;
    
    // Trier par horodatage pour traiter les mises à jour dans l'ordre
    this.updateQueue.sort((a, b) => a.timestamp - b.timestamp);
    
    // Regrouper les mises à jour pour minimiser les opérations
    const totalAmount = this.updateQueue.reduce((sum, item) => sum + item.amount, 0);
    this.updateQueue = [];
    
    // Appliquer la mise à jour combinée
    if (totalAmount !== 0) {
      this.updateBalance(totalAmount);
    }
  }

  // Forcer la synchronisation du solde (utilisé pour les synchronisations serveur)
  forceBalanceSync(newBalance: number, userId?: string): void {
    if (isNaN(newBalance) || newBalance < 0) return;
    
    if (userId && userId !== this.userId) {
      this.resetState();
      this.userId = userId;
      localStorage.setItem('currentUserId', userId);
    }
    
    // CRITIQUE: Ne jamais permettre au solde de diminuer sans raison
    if (newBalance < this.currentBalance) {
      console.error(`Tentative de réduction du solde détectée: ${this.currentBalance}€ -> ${newBalance}€`);
      
      // Utiliser le solde le plus élevé pour éviter les réductions
      const effectiveBalance = Math.max(newBalance, this.currentBalance);
      this.currentBalance = effectiveBalance;
      
      // Persistance dans le stockage local
      localStorage.setItem('currentBalance', effectiveBalance.toString());
      localStorage.setItem('lastKnownBalance', effectiveBalance.toString());
      localStorage.setItem('lastUpdatedBalance', effectiveBalance.toString());
      sessionStorage.setItem('currentBalance', effectiveBalance.toString());
    } else {
      this.currentBalance = newBalance;
      
      // Persistance dans le stockage local
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      localStorage.setItem('lastUpdatedBalance', newBalance.toString());
      sessionStorage.setItem('currentBalance', newBalance.toString());
    }
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (newBalance > this.highestBalance) {
      this.highestBalance = newBalance;
      localStorage.setItem('highest_balance', newBalance.toString());
    }
    
    // Enregistrer l'horodatage de la dernière mise à jour
    this.lastUpdateTime = Date.now();
    localStorage.setItem('lastBalanceUpdateTime', this.lastUpdateTime.toString());
    
    // Notifier les observateurs du changement
    this.notifyWatchers();
  }

  // Mettre à jour le solde le plus élevé
  updateHighestBalance(balance: number): void {
    if (isNaN(balance) || balance <= 0) return;
    
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      localStorage.setItem('highest_balance', balance.toString());
    }
  }

  // Réinitialiser l'état du gestionnaire
  resetState(): void {
    this.currentBalance = 0;
    this.dailyGains = 0;
    this.highestBalance = 0;
    this.lastUpdateTime = 0;
    this.userId = undefined;
    this.updateQueue = [];
    this.persistentStateInitialized = false;
  }

  // Ajouter un observateur pour les changements de solde
  addWatcher(callback: (balance: number) => void): () => void {
    this.watchers.push(callback);
    
    // Exécuter immédiatement le callback avec le solde actuel
    callback(this.currentBalance);
    
    // Retourner une fonction pour supprimer l'observateur
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }

  // Notifier tous les observateurs d'un changement de solde
  private notifyWatchers(): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(this.currentBalance);
      } catch (e) {
        console.error("Erreur lors de la notification d'un observateur:", e);
      }
    });
  }

  // Vérifier que le gestionnaire est initialisé
  isInitialized(): boolean {
    return this.persistentStateInitialized;
  }

  // Get user ID
  getUserId(): string | null {
    return this.userId || null;
  }
  
  // Check if daily limit is reached based on subscription
  isDailyLimitReached(subscription: string): boolean {
    // Use the imported SUBSCRIPTION_LIMITS instead of require
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Check if daily gains have reached 95% of the limit
    return this.dailyGains >= dailyLimit * 0.95;
  }
  
  // Get remaining daily allowance
  getRemainingDailyAllowance(subscription: string): number {
    // Use the imported SUBSCRIPTION_LIMITS instead of require
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Return the remaining amount (with a minimum of 0)
    return Math.max(0, dailyLimit - this.dailyGains);
  }
}

// Exporter une instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;
