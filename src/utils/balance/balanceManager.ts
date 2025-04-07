
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
  minDisplayBalance: number; // Valeur minimale à afficher pendant les transitions
  userId: string | null; // Ajout du userId pour identifier l'utilisateur
}

// État global initial
const initialState: BalanceState = {
  lastKnownBalance: 0,
  highestReachedBalance: 0,
  lastTransactionAmount: 0,
  lastTransactionTime: new Date().toISOString(),
  dailyGains: 0,
  isSyncing: false,
  minDisplayBalance: 0,
  userId: null
};

// Singleton pour la gestion centrale du solde
class BalanceManager {
  private static instance: BalanceManager;
  private state: BalanceState = {...initialState};
  private subscribers: Set<(state: BalanceState) => void> = new Set();
  private isInitialized: boolean = false;
  private pendingUpdates: number[] = [];
  private isInSession: boolean = false;
  
  private constructor() {
    // Récupérer l'ID de l'utilisateur actuel depuis la session
    this.refreshUserIdFromSession();
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
  
  // Actualiser l'ID utilisateur depuis la session
  private async refreshUserIdFromSession(): Promise<void> {
    try {
      // Importer de façon dynamique pour éviter les dépendances circulaires
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.auth.getSession();
      
      if (data?.session?.user?.id) {
        if (this.state.userId !== data.session.user.id) {
          console.log(`[BalanceManager] UserId mis à jour: ${data.session.user.id}`);
          this.state.userId = data.session.user.id;
          // Recharger les données avec le nouvel ID utilisateur
          this.loadFromStorage();
        }
      } else {
        console.log('[BalanceManager] Aucun utilisateur connecté');
      }
    } catch (error) {
      console.error('[BalanceManager] Erreur lors de la récupération de session:', error);
    }
  }
  
  // Initialiser avec les valeurs de la base de données
  public initialize(dbBalance: number): void {
    this.refreshUserIdFromSession().then(() => {
      console.log(`[BalanceManager] Initializing with DB balance: ${dbBalance}, current highest: ${this.state.highestReachedBalance}`);
      
      // PROTECTION CRITIQUE: Ne jamais réduire à une valeur inférieure au maximum historique
      const highestStoredBalance = this.getMaxStoredBalance();
      
      if (this.isInitialized && dbBalance <= highestStoredBalance) {
        console.log(`[BalanceManager] Already initialized with higher balance: ${highestStoredBalance}. Ignoring ${dbBalance}`);
        
        // Si la valeur de la BD est inférieure, forcer la synchronisation avec notre valeur plus élevée
        if (dbBalance < highestStoredBalance) {
          console.log(`[BalanceManager] DB value (${dbBalance}) is lower than stored max (${highestStoredBalance}). Forcing sync...`);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('balance:force-sync', { 
              detail: { balance: highestStoredBalance }
            }));
          }, 1000);
        }
        
        return;
      }
      
      // Ne jamais réduire la valeur minimale d'affichage
      this.state.minDisplayBalance = Math.max(this.state.minDisplayBalance, dbBalance, highestStoredBalance);
      
      // Si la valeur de la BD est supérieure à notre maximum stocké, utiliser celle-ci
      if (dbBalance > highestStoredBalance) {
        this.state.lastKnownBalance = dbBalance;
        this.state.highestReachedBalance = dbBalance;
      } else {
        // Sinon, conserver notre valeur maximale en mémoire
        this.state.lastKnownBalance = highestStoredBalance;
        this.state.highestReachedBalance = highestStoredBalance;
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
    });
  }
  
  // Récupère la valeur maximale du solde à partir de toutes les sources disponibles
  private getMaxStoredBalance(): number {
    if (!this.state.userId) {
      console.warn('[BalanceManager] Tentative de récupérer le solde sans ID utilisateur');
      return 0;
    }
    
    // Récupérer toutes les valeurs possibles
    const currentHighest = this.state.highestReachedBalance || 0;
    const currentBalance = this.state.lastKnownBalance || 0;
    const minDisplay = this.state.minDisplayBalance || 0;
    
    let localStorageMax = 0;
    
    try {
      // Utiliser des clés avec l'ID utilisateur
      const userId = this.state.userId;
      const userBalanceKey = `user_balance_${userId}`;
      const userHighestBalanceKey = `highest_balance_${userId}`;
      const userLastKnownBalanceKey = `last_balance_${userId}`;
      
      // Aussi vérifier les anciennes clés génériques pour la compatibilité
      const storedHighest = localStorage.getItem(userHighestBalanceKey) || localStorage.getItem('highestBalance');
      const storedCurrent = localStorage.getItem(userBalanceKey) || localStorage.getItem('currentBalance');
      const storedLastKnown = localStorage.getItem(userLastKnownBalanceKey) || localStorage.getItem('lastKnownBalance');
      
      const values = [
        storedHighest ? parseFloat(storedHighest) : 0,
        storedCurrent ? parseFloat(storedCurrent) : 0,
        storedLastKnown ? parseFloat(storedLastKnown) : 0
      ].filter(val => !isNaN(val));
      
      if (values.length > 0) {
        localStorageMax = Math.max(...values);
      }
    } catch (e) {
      console.error('[BalanceManager] Failed to read stored balance values:', e);
    }
    
    // Retourner la valeur maximale parmi toutes les sources
    return Math.max(currentHighest, currentBalance, minDisplay, localStorageMax);
  }
  
  // Obtenir le solde actuel
  public getCurrentBalance(): number {
    // Pendant une session, utiliser minDisplayBalance pour éviter les régressions
    if (this.isInSession) {
      return Math.max(this.state.lastKnownBalance, this.state.minDisplayBalance);
    }
    
    // PROTECTION SUPPLÉMENTAIRE: Toujours vérifier avec le localStorage aussi
    const maxStored = this.getMaxStoredBalance();
    return Math.max(this.state.lastKnownBalance, maxStored);
  }
  
  // Obtenir le solde le plus élevé jamais atteint
  public getHighestBalance(): number {
    const maxStored = this.getMaxStoredBalance();
    return Math.max(this.state.highestReachedBalance, maxStored);
  }
  
  // Marquer le début d'une session pour protéger contre les réinitialisations
  public startSession(): void {
    this.isInSession = true;
    // Garantir que la valeur d'affichage minimale est à jour
    this.state.minDisplayBalance = Math.max(
      this.state.minDisplayBalance,
      this.state.lastKnownBalance,
      this.getMaxStoredBalance()
    );
    console.log(`[BalanceManager] Session started, protected balance: ${this.state.minDisplayBalance}`);
  }
  
  // Fin de session
  public endSession(): void {
    this.isInSession = false;
    console.log(`[BalanceManager] Session ended`);
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
      this.state.minDisplayBalance = 0;
      this.saveToStorage();
      this.notifySubscribers();
      return;
    }
    
    // Pour les dépôts et revenus, toujours ajouter au solde actuel
    // PROTECTION CRITIQUE: Utiliser le maximum entre le solde actuel et toutes les sources persistées
    const maxStoredBalance = this.getMaxStoredBalance();
    const baseBalance = Math.max(
      this.state.lastKnownBalance,
      this.isInSession ? this.state.minDisplayBalance : 0,
      maxStoredBalance
    );
    
    const positiveGain = Math.max(0, amount);
    const newBalance = baseBalance + positiveGain;
    
    console.log(`[BalanceManager] Updating balance: ${baseBalance} + ${positiveGain} = ${newBalance}`);
    
    this.state.lastKnownBalance = newBalance;
    this.state.lastTransactionAmount = positiveGain;
    this.state.lastTransactionTime = new Date().toISOString();
    this.state.dailyGains += positiveGain;
    
    // Mettre à jour le solde minimum d'affichage pour éviter les régressions
    this.state.minDisplayBalance = Math.max(this.state.minDisplayBalance, newBalance);
    
    // Mettre à jour le solde maximum si nécessaire
    if (newBalance > this.state.highestReachedBalance) {
      this.state.highestReachedBalance = newBalance;
    }
    
    this.saveToStorage();
    this.notifySubscribers();
    
    // Informer tout le système de la mise à jour
    this.broadcastBalanceUpdate(positiveGain);
  }
  
  // Forcer la définition d'une valeur spécifique (utilisé pour synchronisation avec la base de données)
  public setBalance(amount: number): void {
    if (amount < 0) return;
    
    // PROTECTION CRITIQUE: Ne jamais réduire le solde en dessous du maximum historique
    const maxStoredBalance = this.getMaxStoredBalance();
    
    // Si la nouvelle valeur est inférieure à notre maximum historique, conserver le maximum
    if (amount < maxStoredBalance) {
      console.log(`[BalanceManager] Ignoring lower balance update: ${amount} < ${maxStoredBalance}`);
      
      // Après un délai pour laisser l'UI se stabiliser, forcer la synchronisation avec notre maximum
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('balance:consistent-update', {
          detail: { 
            currentBalance: maxStoredBalance,
            highestBalance: maxStoredBalance,
            amount: 0,
            minDisplayBalance: maxStoredBalance
          }
        }));
      }, 1000);
      
      return;
    }
    
    console.log(`[BalanceManager] Setting balance to: ${amount}`);
    this.state.lastKnownBalance = amount;
    
    // Également mettre à jour la valeur minimale d'affichage
    this.state.minDisplayBalance = Math.max(this.state.minDisplayBalance, amount);
    
    if (amount > this.state.highestReachedBalance) {
      this.state.highestReachedBalance = amount;
    }
    
    this.saveToStorage();
    this.notifySubscribers();
  }
  
  // Réinitialiser totalement le solde (utilisé après un retrait réussi)
  public resetBalance(): void {
    console.log('[BalanceManager] Resetting balance to 0');
    this.state = {...initialState, userId: this.state.userId};
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
    if (!this.state.userId) {
      console.warn('[BalanceManager] Tentative de sauvegarder sans ID utilisateur');
      return;
    }
    
    try {
      // Utiliser des clés avec l'ID utilisateur
      const userId = this.state.userId;
      const userBalanceKey = `user_balance_${userId}`;
      const userHighestBalanceKey = `highest_balance_${userId}`;
      const userLastKnownBalanceKey = `last_balance_${userId}`;
      const userMinDisplayBalanceKey = `min_display_${userId}`;
      const userStateKey = `balance_state_${userId}`;
      
      // Sauvegarder l'état complet
      localStorage.setItem(userStateKey, JSON.stringify(this.state));
      
      // Sauvegarder également les valeurs individuelles pour redondance
      localStorage.setItem(userBalanceKey, String(this.state.lastKnownBalance));
      localStorage.setItem(userHighestBalanceKey, String(this.state.highestReachedBalance));
      localStorage.setItem(userLastKnownBalanceKey, String(this.state.lastKnownBalance));
      localStorage.setItem(userMinDisplayBalanceKey, String(this.state.minDisplayBalance));
      localStorage.setItem(`balance_last_saved_${userId}`, new Date().toISOString());
      
      // Supprimer les anciennes clés génériques pour éviter les confusions
      localStorage.removeItem('balanceState');
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('highestBalance');
      localStorage.removeItem('lastKnownBalance');
      localStorage.removeItem('minDisplayBalance');
    } catch (e) {
      console.error('[BalanceManager] Failed to save state to localStorage:', e);
    }
  }
  
  // Charger l'état depuis localStorage
  private loadFromStorage(): void {
    if (!this.state.userId) {
      console.warn('[BalanceManager] Tentative de charger sans ID utilisateur');
      return;
    }
    
    try {
      // Utiliser des clés avec l'ID utilisateur
      const userId = this.state.userId;
      const userStateKey = `balance_state_${userId}`;
      const userBalanceKey = `user_balance_${userId}`;
      const userHighestBalanceKey = `highest_balance_${userId}`;
      const userLastKnownBalanceKey = `last_balance_${userId}`;
      const userMinDisplayBalanceKey = `min_display_${userId}`;
      
      // Essayer de charger l'état complet
      const savedState = localStorage.getItem(userStateKey);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.state = { ...this.state, ...parsedState, userId: this.state.userId };
        console.log(`[BalanceManager] Loaded state for user ${userId}:`, this.state);
      } else {
        // Compatibilité avec l'ancien système et valeurs individuelles
        const storedHighestBalance = localStorage.getItem(userHighestBalanceKey) || localStorage.getItem('highestBalance');
        const storedCurrentBalance = localStorage.getItem(userBalanceKey) || localStorage.getItem('currentBalance');
        const storedLastKnownBalance = localStorage.getItem(userLastKnownBalanceKey) || localStorage.getItem('lastKnownBalance');
        const storedMinDisplayBalance = localStorage.getItem(userMinDisplayBalanceKey) || localStorage.getItem('minDisplayBalance');
        
        if (storedHighestBalance) {
          this.state.highestReachedBalance = parseFloat(storedHighestBalance);
        }
        
        if (storedMinDisplayBalance) {
          this.state.minDisplayBalance = parseFloat(storedMinDisplayBalance);
        }
        
        // Utiliser la valeur maximale entre toutes les sources disponibles
        const balances = [
          storedCurrentBalance ? parseFloat(storedCurrentBalance) : 0,
          storedLastKnownBalance ? parseFloat(storedLastKnownBalance) : 0,
          storedHighestBalance ? parseFloat(storedHighestBalance) : 0,
          storedMinDisplayBalance ? parseFloat(storedMinDisplayBalance) : 0,
        ].filter(val => !isNaN(val));
        
        if (balances.length > 0) {
          const maxBalance = Math.max(...balances);
          this.state.lastKnownBalance = maxBalance;
          
          if (maxBalance > this.state.highestReachedBalance) {
            this.state.highestReachedBalance = maxBalance;
          }
          
          if (maxBalance > this.state.minDisplayBalance) {
            this.state.minDisplayBalance = maxBalance;
          }
          
          console.log(`[BalanceManager] Loaded from legacy storage for user ${userId}, balance:`, maxBalance);
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
    
    window.addEventListener('session:start', () => {
      this.startSession();
    });
    
    window.addEventListener('session:complete', () => {
      this.endSession();
    });
    
    // Actualiser l'ID utilisateur lorsque le statut d'authentification change
    window.addEventListener('auth:state-change', () => {
      this.refreshUserIdFromSession();
    });
    
    // Nouvelle vérification périodique pour garantir la cohérence
    setInterval(() => {
      // Vérifier les inconsistances entre le localStorage et la mémoire
      const maxStored = this.getMaxStoredBalance();
      const currentInMemory = this.state.lastKnownBalance;
      
      // Si la valeur maximale en stockage est supérieure à celle en mémoire, synchroniser
      if (maxStored > currentInMemory) {
        console.log(`[BalanceManager] Inconsistency detected: stored=${maxStored}, memory=${currentInMemory}. Synchronizing...`);
        this.state.lastKnownBalance = maxStored;
        this.state.highestReachedBalance = Math.max(maxStored, this.state.highestReachedBalance);
        this.state.minDisplayBalance = Math.max(maxStored, this.state.minDisplayBalance);
        
        this.saveToStorage();
        this.notifySubscribers();
        this.broadcastBalanceUpdate(0);
      }
      
      // Actualiser périodiquement l'ID utilisateur
      this.refreshUserIdFromSession();
    }, 30000); // Vérifier toutes les 30 secondes
  }
  
  // Informer tout le système d'une mise à jour du solde
  private broadcastBalanceUpdate(amount: number): void {
    window.dispatchEvent(new CustomEvent('balance:consistent-update', {
      detail: {
        currentBalance: this.state.lastKnownBalance,
        highestBalance: this.state.highestReachedBalance,
        amount: amount,
        minDisplayBalance: this.state.minDisplayBalance,
        userId: this.state.userId
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
export const startBalanceSession = (): void => balanceManager.startSession();
export const endBalanceSession = (): void => balanceManager.endSession();
