
/**
 * Gestionnaire centralisé pour le solde de l'utilisateur
 * Assure une persistance et une cohérence des données entre les composants
 */

// Types
type BalanceWatcher = (balance: number) => void;
type BalanceChangeData = { oldBalance: number; newBalance: number; gain: number };

class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private lastDayTracked: string = '';
  private watchers: BalanceWatcher[] = [];
  private lastBalanceChangeData: BalanceChangeData | null = null;
  private userId: string | null = null;
  private initialized: boolean = false;
  private highestBalance: number = 0;

  constructor() {
    this.initialize();
  }

  /**
   * Initialise le gestionnaire au démarrage avec les données localStorage
   */
  private initialize(): void {
    try {
      // Récupérer la date d'aujourd'hui au format YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Essayer de restaurer les gains journaliers depuis localStorage
      const storedDailyGains = localStorage.getItem('dailyGains');
      const storedDayTracked = localStorage.getItem('lastDayTracked');
      
      // Si nous sommes un jour différent, réinitialiser les gains journaliers
      if (storedDayTracked !== today) {
        this.dailyGains = 0;
        this.lastDayTracked = today;
        
        localStorage.setItem('dailyGains', '0');
        localStorage.setItem('lastDayTracked', today);
      } else if (storedDailyGains) {
        // Sinon restaurer les gains journaliers
        this.dailyGains = parseFloat(storedDailyGains);
        this.lastDayTracked = storedDayTracked || today;
      } else {
        // Cas par défaut
        this.dailyGains = 0;
        this.lastDayTracked = today;
        
        localStorage.setItem('dailyGains', '0');
        localStorage.setItem('lastDayTracked', today);
      }
      
      // Restaurer le solde depuis localStorage (en vérifiant plusieurs sources)
      const storedBalance = localStorage.getItem('currentBalance') || localStorage.getItem('lastKnownBalance');
      if (storedBalance) {
        this.currentBalance = parseFloat(storedBalance);
      }
      
      // Restaurer le solde le plus élevé depuis localStorage
      const storedHighestBalance = localStorage.getItem('highest_balance') || localStorage.getItem('highestBalance');
      if (storedHighestBalance) {
        this.highestBalance = parseFloat(storedHighestBalance);
      }
      
      this.initialized = true;
      console.log(`BalanceManager initialized: balance=${this.currentBalance}€, dailyGains=${this.dailyGains}€, highestBalance=${this.highestBalance}€`);
    } catch (error) {
      console.error("Error initializing balance manager:", error);
    }
  }

  /**
   * Recharge le solde depuis localStorage (utile après des modifications externes)
   */
  public reloadFromStorage(): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Vérifier si le jour a changé
      const storedDayTracked = localStorage.getItem('lastDayTracked');
      if (storedDayTracked !== today) {
        // Nouveau jour, réinitialiser les gains journaliers
        this.dailyGains = 0;
        this.lastDayTracked = today;
        localStorage.setItem('dailyGains', '0');
        localStorage.setItem('lastDayTracked', today);
      }
      
      // Charger le solde depuis localStorage (en vérifiant plusieurs sources)
      let highestBalance = this.currentBalance;
      
      const sources = [
        localStorage.getItem('currentBalance'),
        localStorage.getItem('lastKnownBalance'),
        localStorage.getItem('highestBalance'),
        localStorage.getItem('highest_balance')
      ];
      
      // Utiliser le solde le plus élevé parmi toutes les sources
      for (const source of sources) {
        if (source) {
          try {
            const parsedValue = parseFloat(source);
            if (!isNaN(parsedValue) && parsedValue > highestBalance) {
              highestBalance = parsedValue;
            }
          } catch (e) {
            console.error("Failed to parse stored balance:", e);
          }
        }
      }
      
      // Mettre à jour uniquement si le solde a changé
      if (highestBalance !== this.currentBalance) {
        const oldBalance = this.currentBalance;
        this.currentBalance = highestBalance;
        
        // Notifier les watchers
        this.notifyWatchers();
        
        // Sauvegarder le changement
        this.lastBalanceChangeData = {
          oldBalance,
          newBalance: highestBalance,
          gain: highestBalance - oldBalance
        };
        
        // Assurer la persistance dans localStorage
        localStorage.setItem('currentBalance', highestBalance.toString());
        localStorage.setItem('lastKnownBalance', highestBalance.toString());
      }
      
      // Mettre à jour le solde le plus élevé si nécessaire
      this.updateHighestBalance(highestBalance);
    } catch (error) {
      console.error("Error reloading balance from storage:", error);
    }
  }

  /**
   * Ajoute un watcher qui sera notifié lors des changements de solde
   */
  public addWatcher(watcher: BalanceWatcher): () => void {
    this.watchers.push(watcher);
    
    // Appeler immédiatement le watcher avec la valeur actuelle
    try {
      watcher(this.currentBalance);
    } catch (error) {
      console.error("Error calling balance watcher:", error);
    }
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.watchers = this.watchers.filter(w => w !== watcher);
    };
  }

  /**
   * Notifie tous les watchers d'un changement de solde
   */
  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      try {
        watcher(this.currentBalance);
      } catch (error) {
        console.error("Error notifying balance watcher:", error);
      }
    }
  }

  /**
   * Met à jour le solde avec un gain
   */
  public updateBalance(gain: number): void {
    if (isNaN(gain) || gain < 0) {
      console.error("Invalid gain value:", gain);
      return;
    }
    
    // Vérifier si le jour a changé
    const today = new Date().toISOString().split('T')[0];
    if (this.lastDayTracked !== today) {
      // Nouveau jour, réinitialiser les gains journaliers
      this.dailyGains = 0;
      this.lastDayTracked = today;
      localStorage.setItem('dailyGains', '0');
      localStorage.setItem('lastDayTracked', today);
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance = parseFloat((this.currentBalance + gain).toFixed(2));
    
    // Enregistrer les informations du changement
    this.lastBalanceChangeData = {
      oldBalance,
      newBalance: this.currentBalance,
      gain
    };
    
    // Assurer la persistance dans localStorage
    localStorage.setItem('currentBalance', this.currentBalance.toString());
    localStorage.setItem('lastKnownBalance', this.currentBalance.toString());
    
    // Mettre à jour le solde le plus élevé si nécessaire
    this.updateHighestBalance(this.currentBalance);
    
    // Notifier tous les watchers
    this.notifyWatchers();
  }

  /**
   * Force la synchronisation du solde avec une valeur spécifique
   */
  public forceBalanceSync(balance: number, userId?: string): void {
    if (isNaN(balance) || balance < 0) {
      console.error("Invalid balance value for sync:", balance);
      return;
    }
    
    if (userId) {
      this.userId = userId;
    }
    
    if (balance === this.currentBalance) {
      return; // Pas de changement nécessaire
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance = parseFloat(balance.toFixed(2));
    
    // Enregistrer les informations du changement
    this.lastBalanceChangeData = {
      oldBalance,
      newBalance: balance,
      gain: balance - oldBalance
    };
    
    // Assurer la persistance dans localStorage
    localStorage.setItem('currentBalance', this.currentBalance.toString());
    localStorage.setItem('lastKnownBalance', this.currentBalance.toString());
    
    // Pour les grandes différences positives, enregistrer également comme solde maximal
    if (balance > oldBalance + 0.1) {
      this.updateHighestBalance(balance);
    }
    
    // Notifier tous les watchers
    this.notifyWatchers();
  }

  /**
   * Ajoute un gain journalier au compteur
   */
  public addDailyGain(gain: number): void {
    if (isNaN(gain) || gain < 0) {
      return;
    }
    
    // Vérifier si le jour a changé
    const today = new Date().toISOString().split('T')[0];
    if (this.lastDayTracked !== today) {
      // Nouveau jour, réinitialiser les gains journaliers
      this.dailyGains = gain;
      this.lastDayTracked = today;
    } else {
      // Même jour, ajouter au compteur
      this.dailyGains = parseFloat((this.dailyGains + gain).toFixed(2));
    }
    
    // Assurer la persistance dans localStorage
    localStorage.setItem('dailyGains', this.dailyGains.toString());
    localStorage.setItem('lastDayTracked', today);
  }

  /**
   * Définit explicitement la valeur des gains journaliers
   */
  public setDailyGains(gains: number): void {
    if (isNaN(gains) || gains < 0) {
      return;
    }
    
    this.dailyGains = parseFloat(gains.toFixed(2));
    
    // Assurer la persistance dans localStorage
    localStorage.setItem('dailyGains', this.dailyGains.toString());
    localStorage.setItem('lastDayTracked', this.lastDayTracked);
  }

  /**
   * Récupère le solde actuel
   */
  public getCurrentBalance(): number {
    // Si non initialisé, essayer de charger depuis localStorage
    if (!this.initialized) {
      this.reloadFromStorage();
    }
    return this.currentBalance;
  }

  /**
   * Récupère les gains journaliers
   */
  public getDailyGains(): number {
    // Vérifier si le jour a changé
    const today = new Date().toISOString().split('T')[0];
    if (this.lastDayTracked !== today) {
      // Nouveau jour, réinitialiser les gains journaliers
      this.dailyGains = 0;
      this.lastDayTracked = today;
      localStorage.setItem('dailyGains', '0');
      localStorage.setItem('lastDayTracked', today);
    }
    
    return this.dailyGains;
  }

  /**
   * Récupère les dernières informations de changement de solde
   */
  public getLastBalanceChange(): BalanceChangeData | null {
    return this.lastBalanceChangeData;
  }

  /**
   * Réinitialise le solde et les gains journaliers
   */
  public reset(): void {
    const oldBalance = this.currentBalance;
    this.currentBalance = 0;
    this.dailyGains = 0;
    
    // Enregistrer les informations du changement
    this.lastBalanceChangeData = {
      oldBalance,
      newBalance: 0,
      gain: -oldBalance
    };
    
    // Assurer la persistance dans localStorage
    localStorage.setItem('currentBalance', '0');
    localStorage.setItem('lastKnownBalance', '0');
    localStorage.setItem('dailyGains', '0');
    localStorage.setItem('lastDayTracked', this.lastDayTracked);
    
    // Notifier tous les watchers
    this.notifyWatchers();
  }

  /**
   * Vérifie si l'utilisateur est identifié
   */
  public hasUserId(): boolean {
    return this.userId !== null;
  }

  /**
   * Définit l'ID utilisateur
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }
  
  /**
   * Met à jour la valeur du solde le plus élevé si la nouvelle valeur est supérieure
   */
  public updateHighestBalance(balance: number): void {
    if (isNaN(balance) || balance < 0) {
      return;
    }
    
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      localStorage.setItem('highest_balance', balance.toString());
      localStorage.setItem('highestBalance', balance.toString());
    }
  }
  
  /**
   * Récupère la valeur du solde le plus élevé jamais atteint
   */
  public getHighestBalance(): number {
    return this.highestBalance;
  }
  
  /**
   * Vérifie s'il y a un changement significatif entre le solde actuel et le solde du serveur
   * Utile pour détecter des problèmes de synchronisation
   */
  public checkForSignificantBalanceChange(serverBalance: number): boolean {
    if (isNaN(serverBalance)) return false;
    
    const difference = Math.abs(this.currentBalance - serverBalance);
    const isSignificant = difference > 1; // Différence de plus de 1€ considérée comme significative
    
    if (isSignificant) {
      console.warn(`Significant balance difference detected: local=${this.currentBalance}€, server=${serverBalance}€, diff=${difference}€`);
    }
    
    return isSignificant;
  }
}

// Exporter une instance unique du gestionnaire pour toute l'application
const balanceManager = new BalanceManager();
export default balanceManager;
