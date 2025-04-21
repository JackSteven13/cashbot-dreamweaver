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
      const storedHighestBalance = localStorage.getItem(this.highestBalanceKey);
      
      let highestBalance = 0;
      
      // Si on a un solde persisté, l'utiliser comme base
      if (persistedBalance) {
        const balance = parseFloat(persistedBalance);
        if (!isNaN(balance)) {
          highestBalance = Math.max(highestBalance, balance);
        }
      }
      
      // Si on a le solde le plus élevé jamais atteint, le comparer
      if (storedHighestBalance) {
        const highest = parseFloat(storedHighestBalance);
        if (!isNaN(highest)) {
          highestBalance = Math.max(highestBalance, highest);
        }
      }
      
      // Si on a des gains journaliers stockés, les récupérer
      if (storedDailyGains) {
        const gains = parseFloat(storedDailyGains);
        if (!isNaN(gains)) {
          this.dailyGains = gains;
        }
      }
      
      // Vérifier TOUTES les sources potentielles de solde
      const potentialSources = [
        localStorage.getItem('currentBalance'),
        localStorage.getItem('lastKnownBalance'),
        ...Object.keys(localStorage)
          .filter(key => key.startsWith('user_balance_') || key.startsWith('highest_balance_') || key.startsWith('last_known_balance_'))
          .map(key => localStorage.getItem(key))
      ];
      
      // Utiliser la valeur la plus élevée parmi toutes les sources
      for (const source of potentialSources) {
        if (source) {
          try {
            const value = parseFloat(source);
            if (!isNaN(value)) {
              highestBalance = Math.max(highestBalance, value);
            }
          } catch (e) {
            console.error("Erreur lors de la lecture d'une source de solde:", e);
          }
        }
      }
      
      // Mettre à jour le solde avec la valeur la plus élevée trouvée
      this.currentBalance = highestBalance;
      
      console.log(`BalanceManager initialisé avec un solde de ${this.currentBalance}€`);
      
      // Ajouter les listeners d'événements
      this.addEventListeners();
      
      this.initialized = true;
      this.lastUpdateTime = Date.now();
      
      // Persister le solde initial et sauvegarder comme valeur la plus élevée
      this.persistBalance();
      this.updateHighestBalance(this.currentBalance);
      
      // Annoncer le solde initial avec un événement
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('balance:initialized', {
          detail: {
            balance: this.currentBalance,
          }
        }));
      }, 100);
    } catch (e) {
      console.error("Erreur lors de l'initialisation du BalanceManager:", e);
    }
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
        
        if (typeof newBalance === 'number' && !isNaN(newBalance)) {
          this.updateBalance(newBalance);
        } else if (typeof gain === 'number' && !isNaN(gain)) {
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
        
        if (typeof balance === 'number' && !isNaN(balance) && balance > this.currentBalance) {
          this.updateBalance(balance);
        }
      }) as EventListener);
      
      // Nouvelle logique: écouter les événements de récupération de solde du serveur
      window.addEventListener('user:data-loaded', ((event: CustomEvent) => {
        const serverBalance = event.detail?.balance;
        
        if (typeof serverBalance === 'number' && !isNaN(serverBalance)) {
          // Comparer le solde du serveur avec celui stocké localement
          if (serverBalance > this.currentBalance) {
            console.log(`Le solde du serveur (${serverBalance}€) est supérieur au solde local (${this.currentBalance}€). Mise à jour...`);
            this.updateBalance(serverBalance);
          } else {
            console.log(`Le solde local (${this.currentBalance}€) est supérieur ou égal au solde du serveur (${serverBalance}€). Conservation du solde local.`);
            
            // Force la synchronisation avec le serveur si le solde local est significativement plus élevé
            if (this.currentBalance > serverBalance * 1.1) {  // 10% de différence
              console.log(`La différence de solde est significative. Émission d'un événement pour synchroniser avec le serveur.`);
              window.dispatchEvent(new CustomEvent('balance:server-sync-needed', {
                detail: {
                  localBalance: this.currentBalance,
                  serverBalance: serverBalance
                }
              }));
            }
          }
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
      
      // Mettre à jour également le solde le plus élevé si nécessaire
      this.updateHighestBalance(this.currentBalance);
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
  getCurrentBalance(userId?: string): number {
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
    // N'accepter que des valeurs positives ou nulles et valides
    if (newBalance < 0 || isNaN(newBalance)) {
      console.warn("Tentative de mise à jour du solde avec une valeur invalide:", newBalance);
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
    // Vérifier que le montant est valide
    if (isNaN(amount)) {
      console.warn("Tentative d'ajout d'un montant invalide au solde:", amount);
      return;
    }
    
    const newBalance = parseFloat((this.currentBalance + amount).toFixed(2));
    this.updateBalance(newBalance);
  }
  
  /**
   * Ajoute un montant aux gains journaliers
   */
  addDailyGain(amount: number) {
    if (amount <= 0 || isNaN(amount)) return;
    
    this.dailyGains = parseFloat((this.dailyGains + amount).toFixed(2));
    this.persistDailyGains();
    
    // Mettre à jour le solde également
    this.addToBalance(amount);
  }
  
  /**
   * Définit les gains journaliers à une valeur spécifique
   */
  setDailyGains(amount: number) {
    if (amount < 0 || isNaN(amount)) return;
    
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
    if (typeof balance !== 'number' || isNaN(balance) || balance < 0) {
      console.warn("Tentative de synchronisation forcée avec une valeur invalide:", balance);
      return;
    }
    
    if (userId) {
      this.userIds.add(userId);
    }
    
    // IMPORTANT: Ne mettre à jour le solde que si la nouvelle valeur est supérieure
    // pour éviter les régressions du solde
    if (balance > this.currentBalance) {
      console.log(`Synchronisation forcée: ${this.currentBalance}€ -> ${balance}€ (augmentation)`)
      this.updateBalance(balance);
      
      // Émettre un ��vénement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: {
          newBalance: this.currentBalance,
          userId: Array.from(this.userIds)[0] || null
        }
      }));
    } else {
      console.log(`Synchronisation forcée ignorée: ${balance}€ <= ${this.currentBalance}€ (maintien du solde supérieur)`);
    }
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
  getHighestBalance(userId?: string): number {
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
  updateHighestBalance(balance: number, userId?: string): void {
    try {
      // Vérifier que la valeur est valide
      if (isNaN(balance) || balance < 0) {
        return;
      }
      
      const current = this.getHighestBalance();
      if (balance > current) {
        localStorage.setItem(this.highestBalanceKey, balance.toString());
        console.log(`Nouveau record de solde enregistré: ${balance}€`);
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
        const userHighestBalanceKey = `highest_balance_${userId}`;
        const storedBalance = localStorage.getItem(userBalanceKey);
        const storedHighestBalance = localStorage.getItem(userHighestBalanceKey);
        
        let highestKnownBalance = this.currentBalance;
        
        // Vérifier le solde stocké pour cet utilisateur
        if (storedBalance) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance)) {
            highestKnownBalance = Math.max(highestKnownBalance, parsedBalance);
          }
        }
        
        // Vérifier aussi le solde le plus élevé stocké pour cet utilisateur
        if (storedHighestBalance) {
          const parsedHighest = parseFloat(storedHighestBalance);
          if (!isNaN(parsedHighest)) {
            highestKnownBalance = Math.max(highestKnownBalance, parsedHighest);
          }
        }
        
        // Si on a trouvé un solde plus élevé, l'utiliser
        if (highestKnownBalance > this.currentBalance) {
          this.updateBalance(highestKnownBalance);
          console.log(`Restored balance for user ${userId}: ${highestKnownBalance}€`);
          
          // Informer le système d'un changement de solde significatif
          window.dispatchEvent(new CustomEvent('balance:restored', {
            detail: { 
              balance: highestKnownBalance, 
              userId,
              previousBalance: this.currentBalance
            }
          }));
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
  
  /**
   * Vérifie si le solde a changé significativement depuis le dernier chargement
   * et envoie un événement pour alerter le système
   */
  checkForSignificantBalanceChange(serverBalance: number, userId?: string): void {
    // Vérifier que la valeur est valide
    if (!serverBalance || isNaN(serverBalance)) return;
    
    const localBalance = this.currentBalance;
    const difference = Math.abs(localBalance - serverBalance);
    const threshold = 0.5; // Différence significative à partir de 0,50€
    
    if (difference > threshold) {
      console.log(`Différence significative de solde détectée: Local=${localBalance}€, Serveur=${serverBalance}€`);
      
      // Utiliser toujours le solde le plus élevé
      const highestBalance = Math.max(localBalance, serverBalance);
      
      if (highestBalance !== localBalance) {
        this.updateBalance(highestBalance);
      }
      
      window.dispatchEvent(new CustomEvent('balance:significant-change', {
        detail: {
          localBalance,
          serverBalance,
          resolvedBalance: highestBalance
        }
      }));
    }
  }
}

// Exporter une instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;
