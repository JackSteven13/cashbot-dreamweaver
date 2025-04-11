
/**
 * Gestionnaire de solde centralisé qui maintient une cohérence entre
 * les différents composants qui affichent ou manipulent le solde de l'utilisateur
 */

type BalanceSubscriber = (state: BalanceState) => void;

interface BalanceState {
  lastKnownBalance: number;
  timestamp: number;
  userId: string | null;
}

class BalanceManager {
  private static instance: BalanceManager;
  private subscribers: BalanceSubscriber[] = [];
  private state: BalanceState = {
    lastKnownBalance: 0,
    timestamp: Date.now(),
    userId: null
  };
  private highestBalance: number = 0;
  
  private constructor() {
    // Initialiser depuis localStorage si disponible
    try {
      const storedBalance = localStorage.getItem('lastKnownBalance');
      const storedHighestBalance = localStorage.getItem('highestBalance');
      
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance)) {
          this.state.lastKnownBalance = parsedBalance;
        }
      }
      
      if (storedHighestBalance) {
        const parsedHighest = parseFloat(storedHighestBalance);
        if (!isNaN(parsedHighest)) {
          this.highestBalance = parsedHighest;
        }
      }
    } catch (e) {
      console.error("Failed to read balance from localStorage:", e);
    }
  }
  
  /**
   * Obtenir l'instance unique du gestionnaire de solde
   */
  public static getInstance(): BalanceManager {
    if (!BalanceManager.instance) {
      BalanceManager.instance = new BalanceManager();
    }
    return BalanceManager.instance;
  }
  
  /**
   * Initialise le gestionnaire avec un solde connu et un ID utilisateur
   */
  public initialize(balance: number, userId: string | null = null): void {
    if (balance > this.state.lastKnownBalance) {
      this.state.lastKnownBalance = balance;
      this.highestBalance = Math.max(this.highestBalance, balance);
      this.state.timestamp = Date.now();
      
      try {
        localStorage.setItem('lastKnownBalance', balance.toString());
        localStorage.setItem('highestBalance', this.highestBalance.toString());
      } catch (e) {
        console.error("Failed to write balance to localStorage:", e);
      }
    }
    
    if (userId) {
      this.state.userId = userId;
      
      // Essayer de récupérer des valeurs spécifiques à cet utilisateur
      try {
        const userBalanceKey = `user_balance_${userId}`;
        const userHighestBalanceKey = `highest_balance_${userId}`;
        
        const storedUserBalance = localStorage.getItem(userBalanceKey);
        const storedUserHighest = localStorage.getItem(userHighestBalanceKey);
        
        if (storedUserBalance) {
          const parsedUserBalance = parseFloat(storedUserBalance);
          if (!isNaN(parsedUserBalance)) {
            if (parsedUserBalance > this.state.lastKnownBalance) {
              this.state.lastKnownBalance = parsedUserBalance;
            }
          }
        }
        
        if (storedUserHighest) {
          const parsedUserHighest = parseFloat(storedUserHighest);
          if (!isNaN(parsedUserHighest)) {
            this.highestBalance = Math.max(this.highestBalance, parsedUserHighest);
          }
        }
      } catch (e) {
        console.error("Failed to read user-specific balance from localStorage:", e);
      }
    }
  }
  
  /**
   * Met à jour le solde et notifie tous les abonnés
   */
  public updateBalance(balance: number, userId: string | null = null): void {
    // Assurons-nous que le solde ne diminue jamais
    if (balance >= this.state.lastKnownBalance) {
      this.state.lastKnownBalance = balance;
      this.highestBalance = Math.max(this.highestBalance, balance);
      this.state.timestamp = Date.now();
      
      if (userId) {
        this.state.userId = userId;
      }
      
      // Persister le solde
      try {
        localStorage.setItem('lastKnownBalance', balance.toString());
        localStorage.setItem('highestBalance', this.highestBalance.toString());
        localStorage.setItem('currentBalance', balance.toString());
        
        if (this.state.userId) {
          const userBalanceKey = `user_balance_${this.state.userId}`;
          const userHighestBalanceKey = `highest_balance_${this.state.userId}`;
          localStorage.setItem(userBalanceKey, balance.toString());
          localStorage.setItem(userHighestBalanceKey, this.highestBalance.toString());
        }
      } catch (e) {
        console.error("Failed to write balance to localStorage:", e);
      }
      
      // Notifier les abonnés
      this.notifySubscribers();
    } else {
      console.log(`Rejected balance update: new (${balance}) < current (${this.state.lastKnownBalance})`);
    }
  }
  
  /**
   * Réinitialise le solde à 0 (par exemple après un retrait)
   */
  public resetBalance(): void {
    this.state.lastKnownBalance = 0;
    this.state.timestamp = Date.now();
    
    try {
      localStorage.setItem('lastKnownBalance', '0');
      localStorage.setItem('currentBalance', '0');
      
      if (this.state.userId) {
        const userBalanceKey = `user_balance_${this.state.userId}`;
        localStorage.setItem(userBalanceKey, '0');
      }
    } catch (e) {
      console.error("Failed to reset balance in localStorage:", e);
    }
    
    this.notifySubscribers();
  }
  
  /**
   * S'abonne aux changements de solde
   * @returns Fonction de désabonnement
   */
  public subscribe(subscriber: BalanceSubscriber): () => void {
    this.subscribers.push(subscriber);
    
    // Notifier immédiatement le nouvel abonné avec l'état actuel
    subscriber(this.state);
    
    // Retourner une fonction de désabonnement
    return () => {
      const index = this.subscribers.indexOf(subscriber);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  
  /**
   * Notifie tous les abonnés du nouvel état
   */
  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(this.state);
      } catch (e) {
        console.error("Error in balance subscriber:", e);
      }
    }
  }
  
  /**
   * Récupère le dernier solde connu
   */
  public getLastKnownBalance(): number {
    return this.state.lastKnownBalance;
  }
  
  /**
   * Récupère le solde le plus élevé jamais atteint
   */
  public getHighestBalance(): number {
    return this.highestBalance;
  }
}

export const balanceManager = BalanceManager.getInstance();
