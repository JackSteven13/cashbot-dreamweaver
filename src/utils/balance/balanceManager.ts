/**
 * BalanceManager - Gestionnaire centralisé pour le solde de l'utilisateur
 * Permet de synchroniser l'état du solde entre les différentes parties de l'application
 */

// Type pour les fonctions de watcher
type BalanceWatcher = (newBalance: number) => void;

class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private watchers: BalanceWatcher[] = [];
  private userIds: Set<string> = new Set();
  private initialized: boolean = false;
  private lastUpdateTime: number = 0;
  private persistentBalanceKey = 'persistent_user_balance';
  private dailyGainsKey = 'daily_gains';
  private highestBalanceKey = 'highest_balance';
  
  constructor() {
    this.init();
  }
  
  /**
   * Initialise le gestionnaire de solde
   */
  private init() {
    // Éviter l'initialisation multiple
    if (this.initialized) return;
    
    try {
      // Essayer de récupérer le solde persisté
      const persistedBalance = localStorage.getItem(this.persistentBalanceKey);
      const storedDailyGains = localStorage.getItem(this.dailyGainsKey);
      
      // Si on a un solde persisté, l'utiliser
      if (persistedBalance) {
        const balance = parseFloat(persistedBalance);
        if (!isNaN(balance)) {
          this.currentBalance = balance;
        }
      }
      
      // Si on a des gains journaliers stockés, les récupérer
      if (storedDailyGains) {
        const gains = parseFloat(storedDailyGains);
        if (!isNaN(gains)) {
          this.dailyGains = gains;
        }
      }
      
      // Vérifier d'autres sources de vérité
      const sources = [
        localStorage.getItem('currentBalance'),
        localStorage.getItem('lastKnownBalance'),
      ];
      
      // Utiliser la valeur la plus élevée parmi toutes les sources
      for (const source of sources) {
        if (source) {
          try {
            const value = parseFloat(source);
            if (!isNaN(value) && value > this.currentBalance) {
              this.currentBalance = value;
              // Persister immédiatement la valeur la plus élevée
              this.persistBalance();
            }
          } catch (e) {
            console.error("Erreur lors de la lecture d'une source de solde:", e);
          }
        }
      }
      
      console.log(`BalanceManager initialisé avec un solde de ${this.currentBalance}€`);
      
      // Ajouter les listeners d'événements
      this.addEventListeners();
      
      this.initialized = true;
      this.lastUpdateTime = Date.now();
    } catch (e) {
      console.error("Erreur lors de l'initialisation du BalanceManager:", e);
    }
    
    // Toujours persister le solde initial
    this.persistBalance();
  }
  
  /**
   * Ajoute les écouteurs d'événements pour les mises à jour de solde
   */
  private addEventListeners() {
    try {
      // Écouter les événements de mise à jour de solde
      window.addEventListener('balance:update', ((event: CustomEvent) => {
        const newBalance = event.detail?.newBalance;
        const gain = event.detail?.gain;
        const userId = event.detail?.userId;
        
        if (userId) {
          this.userIds.add(userId);
        }
        
        if (typeof newBalance === 'number') {
          this.updateBalance(newBalance);
        } else if (typeof gain === 'number') {
          this.addToBalance(gain);
        }
      }) as EventListener);
      
      // Écouter les demandes de synchronisation de solde
      window.addEventListener('balance:sync-request', ((event: CustomEvent) => {
        const userId = event.detail?.userId;
        if (userId) {
          this.userIds.add(userId);
        }
        
        // Envoyer un événement avec le solde actuel
        window.dispatchEvent(new CustomEvent('balance:sync-response', {
          detail: {
            balance: this.currentBalance,
            userId: Array.from(this.userIds)[0] || null
          }
        }));
      }) as EventListener);
      
      // Écouter les événements locaux de mise à jour de solde
      window.addEventListener('balance:local-update', ((event: CustomEvent) => {
        const balance = event.detail?.balance;
        const userId = event.detail?.userId;
        
        if (userId) {
          this.userIds.add(userId);
        }
        
        if (typeof balance === 'number' && balance > this.currentBalance) {
          this.updateBalance(balance);
        }
      }) as EventListener);
    } catch (e) {
      console.error("Erreur lors de l'ajout des écouteurs d'événements:", e);
    }
  }
  
  /**
   * Persiste le solde dans le localStorage
   */
  private persistBalance() {
    try {
      localStorage.setItem(this.persistentBalanceKey, this.currentBalance.toString());
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      localStorage.setItem('lastKnownBalance', this.currentBalance.toString());
      
      // Sauvegarder aussi avec les IDs utilisateurs si disponibles
      for (const userId of this.userIds) {
        if (userId) {
          localStorage.setItem(`user_balance_${userId}`, this.currentBalance.toString());
          localStorage.setItem(`last_known_balance_${userId}`, this.currentBalance.toString());
        }
      }
      
      // Sauvegarder la dernière mise à jour
      this.lastUpdateTime = Date.now();
      localStorage.setItem('lastBalanceUpdateTime', this.lastUpdateTime.toString());
    } catch (e) {
      console.error("Erreur lors de la persistance du solde:", e);
    }
  }
  
  /**
   * Persiste les gains journaliers dans le localStorage
   */
  private persistDailyGains() {
    try {
      localStorage.setItem(this.dailyGainsKey, this.dailyGains.toString());
    } catch (e) {
      console.error("Erreur lors de la persistance des gains journaliers:", e);
    }
  }
  
  /**
   * Obtient le solde actuel
   */
  getCurrentBalance(): number {
    return this.currentBalance;
  }
  
  /**
   * Obtient les gains journaliers accumulés
   */
  getDailyGains(): number {
    return this.dailyGains;
  }
  
  /**
   * Met à jour le solde avec une nouvelle valeur
   */
  updateBalance(newBalance: number) {
    // N'accepter que des valeurs positives ou nulles
    if (newBalance < 0) {
      console.warn("Tentative de mise à jour du solde avec une valeur négative:", newBalance);
      return;
    }
    
    // Vérifier si la mise à jour est nécessaire
    if (Math.abs(this.currentBalance - newBalance) < 0.01) {
      return; // Pas de changement significatif
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance = parseFloat(newBalance.toFixed(2));
    
    // Persister le nouveau solde
    this.persistBalance();
    
    // Notifier les watchers
    this.watchers.forEach(watcher => watcher(this.currentBalance));
    
    console.log(`Solde mis à jour: ${oldBalance}€ -> ${this.currentBalance}€`);
  }
  
  /**
   * Ajoute un montant au solde actuel
   */
  addToBalance(amount: number) {
    const newBalance = parseFloat((this.currentBalance + amount).toFixed(2));
    this.updateBalance(newBalance);
  }
  
  /**
   * Ajoute un montant aux gains journaliers
   */
  addDailyGain(amount: number) {
    if (amount <= 0) return;
    
    this.dailyGains = parseFloat((this.dailyGains + amount).toFixed(2));
    this.persistDailyGains();
    
    // Mettre à jour le solde également
    this.addToBalance(amount);
  }
  
  /**
   * Définit les gains journaliers à une valeur spécifique
   */
  setDailyGains(amount: number) {
    if (amount < 0) return;
    
    this.dailyGains = parseFloat(amount.toFixed(2));
    this.persistDailyGains();
  }
  
  /**
   * Réinitialise les gains journaliers
   */
  resetDailyGains(): void {
    this.dailyGains = 0;
    this.persistDailyGains();
    console.log("Daily gains reset to 0");
  }
  
  /**
   * Force la synchronisation du solde avec une valeur spécifique
   * Utile pour garantir la cohérence entre les différentes parties de l'application
   */
  forceBalanceSync(balance: number, userId?: string) {
    if (typeof balance !== 'number' || balance < 0) {
      console.warn("Tentative de synchronisation forcée avec une valeur invalide:", balance);
      return;
    }
    
    if (userId) {
      this.userIds.add(userId);
    }
    
    // Mettre à jour le solde
    this.updateBalance(balance);
    
    // Émettre un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('balance:force-update', {
      detail: {
        newBalance: this.currentBalance,
        userId: Array.from(this.userIds)[0] || null
      }
    }));
    
    console.log(`Synchronisation forcée du solde à ${this.currentBalance}€`);
  }
  
  /**
   * Ajoute un watcher pour surveiller les changements de solde
   */
  addWatcher(watcher: BalanceWatcher) {
    this.watchers.push(watcher);
    
    // Appeler immédiatement le watcher avec le solde actuel
    watcher(this.currentBalance);
    
    // Retourner une fonction pour supprimer le watcher
    return () => {
      this.watchers = this.watchers.filter(w => w !== watcher);
    };
  }
  
  /**
   * Réinitialise le gestionnaire de solde (utile pour les tests)
   */
  reset() {
    this.currentBalance = 0;
    this.dailyGains = 0;
    this.watchers = [];
    this.userIds = new Set();
    this.initialized = false;
    this.lastUpdateTime = 0;
    
    // Nettoyer le localStorage
    localStorage.removeItem(this.persistentBalanceKey);
    localStorage.removeItem(this.dailyGainsKey);
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('lastBalanceUpdateTime');
    
    // Réinitialiser
    this.init();
  }
  
  /**
   * Récupère le solde le plus élevé jamais enregistré
   */
  getHighestBalance(): number {
    try {
      const storedHighest = localStorage.getItem(this.highestBalanceKey);
      if (storedHighest) {
        const value = parseFloat(storedHighest);
        if (!isNaN(value)) {
          return value;
        }
      }
    } catch (e) {
      console.error("Failed to get highest balance:", e);
    }
    return this.currentBalance;
  }
  
  /**
   * Met à jour le solde le plus élevé si nécessaire
   */
  updateHighestBalance(balance: number): void {
    try {
      const current = this.getHighestBalance();
      if (balance > current) {
        localStorage.setItem(this.highestBalanceKey, balance.toString());
      }
    } catch (e) {
      console.error("Failed to update highest balance:", e);
    }
  }
  
  /**
   * Associe un ID utilisateur au gestionnaire de solde
   */
  setUserId(userId: string): void {
    if (userId) {
      this.userIds.add(userId);
      console.log(`User ID set: ${userId}`);
      
      // Vérifier les soldes spécifiques à l'utilisateur
      try {
        const userBalanceKey = `user_balance_${userId}`;
        const storedBalance = localStorage.getItem(userBalanceKey);
        
        if (storedBalance) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance) && parsedBalance > this.currentBalance) {
            this.updateBalance(parsedBalance);
            console.log(`Restored balance for user ${userId}: ${parsedBalance}€`);
          }
        }
      } catch (e) {
        console.error("Error checking user-specific balance:", e);
      }
    }
  }
  
  /**
   * Nettoie toutes les données de solde liées à l'utilisateur
   */
  cleanupUserBalanceData(): void {
    console.log("Cleaning up user balance data");
    
    // Nettoyer les données d'utilisateur
    this.userIds.clear();
    
    // Nettoyer le localStorage des clés spécifiques aux utilisateurs
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('user_balance_') || 
            key.startsWith('last_known_balance_') || 
            key === 'currentBalance' || 
            key === 'lastKnownBalance' || 
            key === this.persistentBalanceKey ||
            key === this.dailyGainsKey) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error("Error cleaning localStorage:", e);
    }
    
    // Réinitialiser les valeurs en mémoire
    this.currentBalance = 0;
    this.dailyGains = 0;
    this.lastUpdateTime = 0;
    
    console.log("User balance data cleanup complete");
  }
}

// Exporter une instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;
