
/**
 * Balance Manager - Source unique de vérité pour le solde utilisateur
 * Ce gestionnaire centralise toute la logique liée aux soldes pour éviter les incohérences
 */

// Interface pour la configuration du gestionnaire de solde
interface BalanceState {
  balance: number;
  lastUpdated: number;
  dailyGains: number;
  lastSyncedWithServer: number;
  source: 'local' | 'server' | 'init';
  serverValue?: number;
  tempValue?: number;
}

class BalanceManager {
  private state: BalanceState;
  private readonly STORAGE_KEY = 'balanceState';
  private readonly LOCAL_TOLERANCE = 0.05; // €0.05 de tolérance pour les différences mineures
  private initialized = false;
  private watchers: Array<(newBalance: number, oldBalance: number) => void> = [];

  constructor() {
    const defaultState: BalanceState = {
      balance: 0,
      lastUpdated: 0,
      dailyGains: 0,
      lastSyncedWithServer: 0,
      source: 'init'
    };
    
    // Essayer de charger l'état depuis localStorage
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsedState = JSON.parse(storedData) as BalanceState;
        
        // Vérifier si les données sont encore pertinentes (max 24h)
        const isValid = Date.now() - parsedState.lastUpdated < 24 * 60 * 60 * 1000;
        
        if (isValid) {
          this.state = parsedState;
        } else {
          // Si les données sont trop anciennes, utiliser les valeurs par défaut
          this.state = defaultState;
        }
      } else {
        this.state = defaultState;
      }
    } catch (e) {
      console.error("Erreur lors du chargement du solde persisté:", e);
      this.state = defaultState;
    }
  }

  // Initialiser le gestionnaire avec une valeur provenant du serveur
  public initialize(serverBalance: number): void {
    if (!this.initialized) {
      // Si c'est la première initialisation, on prend la valeur du serveur
      this.state.serverValue = serverBalance;
      
      if (this.state.source === 'init') {
        // Première initialisation, on utilise la valeur du serveur
        this.state.balance = serverBalance;
        this.state.source = 'server';
      } else if (Math.abs(this.state.balance - serverBalance) > 1.0) {
        // Si la différence est significative (>1€), privilégier le maximum
        // pour ne pas frustrer l'utilisateur
        const newBalance = Math.max(this.state.balance, serverBalance);
        console.log(`Différence significative détectée: local ${this.state.balance}€ vs serveur ${serverBalance}€. Utilisant ${newBalance}€`);
        this.state.balance = newBalance;
      }
      
      this.state.lastSyncedWithServer = Date.now();
      this.initialized = true;
      this._saveState();
      this._notifyWatchers(this.state.balance, 0);
    } else {
      // Pour les initialisations suivantes, on compare avec la valeur actuelle
      this.syncWithServer(serverBalance);
    }
  }

  // Mettre à jour le solde (appel quotidien)
  public updateBalance(gain: number): number {
    const oldBalance = this.state.balance;
    // Arrondir à 2 décimales pour éviter les erreurs de précision
    this.state.balance = parseFloat((this.state.balance + gain).toFixed(2));
    this.state.lastUpdated = Date.now();
    this.state.dailyGains = parseFloat((this.state.dailyGains + gain).toFixed(2));
    this.state.source = 'local';
    
    this._saveState();
    this._notifyWatchers(this.state.balance, oldBalance);
    
    return this.state.balance;
  }

  // Réinitialiser le solde (après un retrait)
  public resetBalance(): void {
    const oldBalance = this.state.balance;
    this.state.balance = 0;
    this.state.lastUpdated = Date.now();
    this.state.source = 'local';
    
    this._saveState();
    this._notifyWatchers(this.state.balance, oldBalance);
  }

  // Synchroniser avec le serveur
  public syncWithServer(serverBalance: number): void {
    // Enregistrer la valeur du serveur
    this.state.serverValue = serverBalance;
    this.state.lastSyncedWithServer = Date.now();
    
    // Si la valeur locale est proche de la valeur du serveur, on garde la locale
    // pour éviter des variations visuelles mineures
    const difference = Math.abs(this.state.balance - serverBalance);
    
    if (difference < this.LOCAL_TOLERANCE) {
      // Différence mineure, on garde la valeur locale
      return;
    }
    
    // Si la différence est plus significative
    if (difference > 2.0) {
      // Différence importante - décision basée sur la valeur la plus élevée
      // pour préserver la satisfaction utilisateur
      const newBalance = Math.max(this.state.balance, serverBalance);
      
      // Seulement si c'est vraiment différent (protection contre les allers-retours)
      if (Math.abs(newBalance - this.state.balance) > this.LOCAL_TOLERANCE) {
        console.log(`Synchronisation avec différence importante. Local: ${this.state.balance}€, Serveur: ${serverBalance}€. Utilisant ${newBalance}€`);
        const oldBalance = this.state.balance;
        this.state.balance = newBalance;
        this._saveState();
        this._notifyWatchers(newBalance, oldBalance);
      }
    } else if (serverBalance > this.state.balance) {
      // Si le serveur a une valeur plus élevée mais raisonnable, l'adopter
      console.log(`Synchronisation normale. Local: ${this.state.balance}€, Serveur: ${serverBalance}€. Utilisant valeur serveur.`);
      const oldBalance = this.state.balance;
      this.state.balance = serverBalance;
      this._saveState();
      this._notifyWatchers(serverBalance, oldBalance);
    }
  }

  // Forcer une synchronisation avec une valeur spécifique (utilisé rarement)
  public forceBalanceSync(newBalance: number): void {
    const oldBalance = this.state.balance;
    this.state.balance = newBalance;
    this.state.lastUpdated = Date.now();
    this.state.source = 'server';
    this.state.serverValue = newBalance;
    this.state.lastSyncedWithServer = Date.now();
    
    this._saveState();
    this._notifyWatchers(newBalance, oldBalance);
  }

  // Réinitialiser les gains quotidiens (appelé à minuit)
  public resetDailyGains(): void {
    this.state.dailyGains = 0;
    this._saveState();
  }

  // Obtenir le solde actuel
  public getCurrentBalance(): number {
    return this.state.balance;
  }

  // Obtenir les gains quotidiens
  public getDailyGains(): number {
    return this.state.dailyGains;
  }

  // Ajouter un gain quotidien au total (pour compatibilité avec persistentGainsTracker)
  public addDailyGain(gain: number): number {
    const oldDailyGains = this.state.dailyGains;
    this.state.dailyGains = parseFloat((this.state.dailyGains + gain).toFixed(2));
    this._saveState();
    return this.state.dailyGains;
  }

  // Réinitialiser les compteurs quotidiens (pour compatibilité avec useMidnightReset)
  public resetDailyCounters(): void {
    this.state.dailyGains = 0;
    this._saveState();
    console.log("Compteurs quotidiens réinitialisés");
  }

  // Nettoyer les données de solde lors d'un changement d'utilisateur
  public cleanupUserBalanceData(): void {
    this.state = {
      balance: 0,
      lastUpdated: 0,
      dailyGains: 0,
      lastSyncedWithServer: 0,
      source: 'init'
    };
    this._saveState();
    
    // Supprimer également d'autres données liées au solde
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');
    sessionStorage.removeItem('currentBalance');
    
    console.log("Données de solde utilisateur nettoyées");
  }

  // Obtenir le solde le plus élevé (pour la synchronisation)
  public getHighestBalance(): number {
    // Comparer avec localStorage et sessionStorage pour une protection supplémentaire
    let highestBalance = this.state.balance;
    
    try {
      const localStorage = parseFloat(window.localStorage.getItem('lastKnownBalance') || '0');
      const sessionStorage = parseFloat(window.sessionStorage.getItem('currentBalance') || '0');
      
      highestBalance = Math.max(highestBalance, localStorage, sessionStorage);
    } catch (e) {
      console.error("Erreur lors de la récupération des valeurs de stockage:", e);
    }
    
    return highestBalance;
  }

  // Enregistrer l'état dans localStorage
  private _saveState(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      
      // Mettre également à jour les valeurs classiques pour la compatibilité
      localStorage.setItem('currentBalance', this.state.balance.toString());
      localStorage.setItem('lastKnownBalance', this.state.balance.toString());
      sessionStorage.setItem('currentBalance', this.state.balance.toString());
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de l'état du solde:", e);
    }
  }

  // Stabiliser le solde pendant l'initialisation
  public getStableBalance(): number {
    // Si nous avons une valeur serveur, l'utiliser comme référence
    if (this.state.serverValue !== undefined) {
      // Privilégier la valeur locale si elle est cohérente
      const diff = Math.abs(this.state.balance - this.state.serverValue);
      if (diff < 1.0) {
        return this.state.balance;
      }
      // Sinon prendre le maximum
      return Math.max(this.state.balance, this.state.serverValue);
    }
    
    // Sans valeur serveur, utiliser le solde actuel
    return this.state.balance;
  }

  // Ajouter un observateur pour les changements de solde
  public addWatcher(callback: (newBalance: number, oldBalance: number) => void): () => void {
    this.watchers.push(callback);
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }

  // Notifier tous les observateurs
  private _notifyWatchers(newBalance: number, oldBalance: number): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(newBalance, oldBalance);
      } catch (e) {
        console.error("Erreur dans un observateur de solde:", e);
      }
    });
  }
}

// Exporter une instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;

// Fonction utilitaire pour obtenir le solde maximum
export const getHighestBalance = (): number => {
  return balanceManager.getHighestBalance();
};

// Fonction utilitaire pour obtenir un solde stable
export const getStableBalance = (): number => {
  return balanceManager.getStableBalance();
};
