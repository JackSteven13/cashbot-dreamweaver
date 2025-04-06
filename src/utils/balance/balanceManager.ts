
/**
 * Gestionnaire centralisé du solde utilisateur
 * Garantit la cohérence entre les différentes parties de l'application
 */

// Structure pour stocker toutes les informations liées au solde
interface BalanceState {
  lastKnownBalance: number;
  highestReachedBalance: number;
  lastTransactionAmount: number;
  lastTransactionTime: string;
  dailyGains: number;
  isSyncing: boolean;
}

// État global initial
const initialState: BalanceState = {
  lastKnownBalance: 0,
  highestReachedBalance: 0,
  lastTransactionAmount: 0,
  lastTransactionTime: new Date().toISOString(),
  dailyGains: 0,
  isSyncing: false
};

// Singleton pour la gestion centrale du solde
class BalanceManager {
  private static instance: BalanceManager;
  private state: BalanceState = {...initialState};
  private subscribers: Set<(state: BalanceState) => void> = new Set();
  private isInitialized: boolean = false;
  private pendingUpdates: number[] = [];
  
  private constructor() {
    this.loadFromStorage();
    this.setupEventListeners();
  }
  
  // Obtenir l'instance unique
  public static getInstance(): BalanceManager {
    if (!BalanceManager.instance) {
      BalanceManager.instance = new BalanceManager();
    }
    return BalanceManager.instance;
  }
  
  // Initialiser avec les valeurs de la base de données
  public initialize(dbBalance: number): void {
    if (this.isInitialized) return;
    
    console.log(`[BalanceManager] Initializing with DB balance: ${dbBalance}`);
    
    this.state.lastKnownBalance = dbBalance;
    
    // Garantir que la valeur maximale est correcte
    if (dbBalance > this.state.highestReachedBalance) {
      this.state.highestReachedBalance = dbBalance;
    }
    
    this.saveToStorage();
    this.isInitialized = true;
    this.notifySubscribers();
    
    // Traiter les mises à jour en attente
    if (this.pendingUpdates.length > 0) {
      console.log(`[BalanceManager] Processing ${this.pendingUpdates.length} pending updates`);
      this.pendingUpdates.forEach(amount => {
        this.updateBalance(amount);
      });
      this.pendingUpdates = [];
    }
  }
  
  // Obtenir le solde actuel
  public getCurrentBalance(): number {
    return this.state.lastKnownBalance;
  }
  
  // Obtenir le solde le plus élevé jamais atteint
  public getHighestBalance(): number {
    return this.state.highestReachedBalance;
  }
  
  // Mettre à jour le solde - ne permet jamais une diminution sauf en cas de retrait explicite
  public updateBalance(amount: number, isWithdrawal: boolean = false): void {
    if (!this.isInitialized) {
      console.log(`[BalanceManager] Not yet initialized, queueing update: ${amount}`);
      this.pendingUpdates.push(amount);
      return;
    }
    
    // En cas de retrait, on réinitialise complètement le système
    if (isWithdrawal) {
      console.log(`[BalanceManager] Processing withdrawal, resetting to 0`);
      this.state.lastKnownBalance = 0;
      this.state.highestReachedBalance = 0;
      this.state.dailyGains = 0;
      this.state.lastTransactionAmount = 0;
      this.saveToStorage();
      this.notifySubscribers();
      return;
    }
    
    // Pour les dépôts et revenus, toujours ajouter au solde actuel
    const newBalance = this.state.lastKnownBalance + amount;
    console.log(`[BalanceManager] Updating balance: ${this.state.lastKnownBalance} + ${amount} = ${newBalance}`);
    
    this.state.lastKnownBalance = newBalance;
    this.state.lastTransactionAmount = amount;
    this.state.lastTransactionTime = new Date().toISOString();
    this.state.dailyGains += amount;
    
    // Mettre à jour le solde maximum si nécessaire
    if (newBalance > this.state.highestReachedBalance) {
      this.state.highestReachedBalance = newBalance;
    }
    
    this.saveToStorage();
    this.notifySubscribers();
    
    // Informer tout le système de la mise à jour
    this.broadcastBalanceUpdate(amount);
  }
  
  // Forcer la définition d'une valeur spécifique (utilisé pour synchronisation avec la base de données)
  public setBalance(amount: number): void {
    if (amount < 0) return;
    
    // Ne jamais réduire le solde affiché
    if (amount < this.state.lastKnownBalance) {
      console.log(`[BalanceManager] Ignoring lower balance update: ${amount} < ${this.state.lastKnownBalance}`);
      return;
    }
    
    console.log(`[BalanceManager] Setting balance to: ${amount}`);
    this.state.lastKnownBalance = amount;
    
    if (amount > this.state.highestReachedBalance) {
      this.state.highestReachedBalance = amount;
    }
    
    this.saveToStorage();
    this.notifySubscribers();
  }
  
  // Réinitialiser totalement le solde (utilisé après un retrait réussi)
  public resetBalance(): void {
    console.log('[BalanceManager] Resetting balance to 0');
    this.state = {...initialState};
    this.saveToStorage();
    this.notifySubscribers();
    
    // Informer tout le système de la réinitialisation
    window.dispatchEvent(new CustomEvent('balance:reset-complete'));
  }
  
  // S'abonner aux changements de solde
  public subscribe(callback: (state: BalanceState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.state); // Appeler immédiatement avec l'état actuel
    
    // Renvoyer une fonction de désinscription
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  // Persister l'état actuel dans localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('balanceState', JSON.stringify(this.state));
      
      // Maintenir également les clés existantes pour la compatibilité
      localStorage.setItem('currentBalance', String(this.state.lastKnownBalance));
      localStorage.setItem('highestBalance', String(this.state.highestReachedBalance));
      localStorage.setItem('lastKnownBalance', String(this.state.lastKnownBalance));
    } catch (e) {
      console.error('[BalanceManager] Failed to save state to localStorage:', e);
    }
  }
  
  // Charger l'état depuis localStorage
  private loadFromStorage(): void {
    try {
      // Essayer de charger l'état complet
      const savedState = localStorage.getItem('balanceState');
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.state = { ...this.state, ...parsedState };
        console.log('[BalanceManager] Loaded state from storage:', this.state);
      } else {
        // Compatibilité avec l'ancien système
        const storedHighestBalance = localStorage.getItem('highestBalance');
        const storedCurrentBalance = localStorage.getItem('currentBalance');
        const storedLastKnownBalance = localStorage.getItem('lastKnownBalance');
        
        if (storedHighestBalance) {
          this.state.highestReachedBalance = parseFloat(storedHighestBalance);
        }
        
        // Utiliser la valeur maximale entre toutes les sources disponibles
        const balances = [
          storedCurrentBalance ? parseFloat(storedCurrentBalance) : 0,
          storedLastKnownBalance ? parseFloat(storedLastKnownBalance) : 0,
          storedHighestBalance ? parseFloat(storedHighestBalance) : 0,
        ].filter(val => !isNaN(val));
        
        if (balances.length > 0) {
          const maxBalance = Math.max(...balances);
          this.state.lastKnownBalance = maxBalance;
          
          if (maxBalance > this.state.highestReachedBalance) {
            this.state.highestReachedBalance = maxBalance;
          }
          
          console.log('[BalanceManager] Loaded from legacy storage, balance:', maxBalance);
        }
      }
    } catch (e) {
      console.error('[BalanceManager] Failed to load state from localStorage:', e);
    }
  }
  
  // Notifier tous les abonnés des changements
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (e) {
        console.error('[BalanceManager] Error in subscriber callback:', e);
      }
    });
  }
  
  // Configurer les écouteurs d'événements pour la synchronisation
  private setupEventListeners(): void {
    window.addEventListener('balance:update', (event: Event) => {
      const customEvent = event as CustomEvent;
      const amount = customEvent.detail?.amount;
      
      if (typeof amount === 'number' && !isNaN(amount) && amount > 0) {
        this.updateBalance(amount);
      }
    });
    
    window.addEventListener('balance:force-update', (event: Event) => {
      const customEvent = event as CustomEvent;
      const newBalance = customEvent.detail?.newBalance;
      
      if (typeof newBalance === 'number' && !isNaN(newBalance) && newBalance >= 0) {
        this.setBalance(newBalance);
      }
    });
    
    window.addEventListener('balance:force-sync', (event: Event) => {
      const customEvent = event as CustomEvent;
      const syncedBalance = customEvent.detail?.balance;
      
      if (typeof syncedBalance === 'number' && !isNaN(syncedBalance) && syncedBalance >= 0) {
        this.setBalance(syncedBalance);
      }
    });
    
    window.addEventListener('balance:reset', () => {
      this.resetBalance();
    });
  }
  
  // Informer tout le système d'une mise à jour du solde
  private broadcastBalanceUpdate(amount: number): void {
    window.dispatchEvent(new CustomEvent('balance:consistent-update', {
      detail: {
        currentBalance: this.state.lastKnownBalance,
        highestBalance: this.state.highestReachedBalance,
        amount: amount
      }
    }));
  }
  
  // Réinitialiser les compteurs quotidiens à minuit
  public resetDailyCounters(): void {
    this.state.dailyGains = 0;
    this.saveToStorage();
  }
}

// Exporter l'instance unique du gestionnaire de solde
export const balanceManager = BalanceManager.getInstance();

// Exporter des fonctions d'aide
export const getCurrentBalance = (): number => balanceManager.getCurrentBalance();
export const getHighestBalance = (): number => balanceManager.getHighestBalance();
export const updateBalance = (amount: number): void => balanceManager.updateBalance(amount);
export const resetBalance = (): void => balanceManager.resetBalance();
export const initializeBalance = (dbBalance: number): void => balanceManager.initialize(dbBalance);
