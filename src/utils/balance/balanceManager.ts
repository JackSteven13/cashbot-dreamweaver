
/**
 * Gestion centralisée du solde utilisateur pour éviter les problèmes de synchronisation
 */
class BalanceManager {
  private currentBalance: number = 0;
  private initialized: boolean = false;
  private userId: string | null = null;
  private localStorageKey: string = 'highestBalance';
  
  /**
   * Initialise le gestionnaire avec une valeur de solde
   */
  initialize(balance: number, userId?: string): void {
    console.log(`[BalanceManager] Initializing with DB balance: ${balance}, current highest: ${this.currentBalance}`);
    
    // Si l'utilisateur change, réinitialiser
    if (userId && this.userId !== userId) {
      this.userId = userId;
      this.currentBalance = balance;
      this.initialized = true;
      this.localStorageKey = `highestBalance_${userId}`;
      
      // Récupérer le solde maximal depuis localStorage
      try {
        const storedBalance = localStorage.getItem(this.localStorageKey);
        if (storedBalance) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance) && parsedBalance > this.currentBalance) {
            this.currentBalance = parsedBalance;
          }
        }
      } catch (e) {
        console.error("[BalanceManager] Failed to read from localStorage:", e);
      }
      
      return;
    }
    
    // Ne mettre à jour que si la nouvelle valeur est supérieure ou si non initialisé
    if (!this.initialized || balance > this.currentBalance) {
      this.currentBalance = balance;
      this.initialized = true;
      
      // Stocker la nouvelle valeur maximale
      if (this.userId) {
        try {
          localStorage.setItem(this.localStorageKey, balance.toString());
        } catch (e) {
          console.error("[BalanceManager] Failed to write to localStorage:", e);
        }
      }
    } else {
      console.log(`[BalanceManager] Already initialized with higher balance: ${this.currentBalance}. Ignoring ${balance}`);
    }
  }
  
  /**
   * Définit directement le solde à une valeur spécifique
   */
  setBalance(balance: number): void {
    console.log(`[BalanceManager] Setting balance to: ${balance}`);
    this.currentBalance = balance;
    this.initialized = true;
    
    // Stocker la nouvelle valeur
    if (this.userId) {
      try {
        localStorage.setItem(this.localStorageKey, balance.toString());
      } catch (e) {
        console.error("[BalanceManager] Failed to write to localStorage:", e);
      }
    }
  }
  
  /**
   * Met à jour le solde en ajoutant un montant
   */
  updateBalance(amount: number): void {
    if (!this.initialized) {
      console.warn("[BalanceManager] Attempting to update uninitialized balance manager");
      this.currentBalance = amount;
      this.initialized = true;
    } else {
      this.currentBalance += amount;
    }
    
    // Stocker la nouvelle valeur
    if (this.userId) {
      try {
        localStorage.setItem(this.localStorageKey, this.currentBalance.toString());
      } catch (e) {
        console.error("[BalanceManager] Failed to write to localStorage:", e);
      }
    }
  }
  
  /**
   * Récupère le solde actuel
   */
  getCurrentBalance(): number {
    return this.currentBalance;
  }
  
  /**
   * Réinitialise le solde à zéro
   */
  resetBalance(): void {
    console.log("[BalanceManager] Resetting balance to zero");
    this.currentBalance = 0;
    
    // Réinitialiser dans localStorage
    if (this.userId) {
      try {
        localStorage.setItem(this.localStorageKey, "0");
      } catch (e) {
        console.error("[BalanceManager] Failed to reset balance in localStorage:", e);
      }
    }
  }
  
  /**
   * Réinitialiser les données pour un utilisateur spécifique
   */
  resetUserData(userId: string): void {
    if (!userId) return;
    
    console.log(`[BalanceManager] Resetting data for user ${userId}`);
    
    // Réinitialiser les gains quotidiens
    const today = new Date().toISOString().split('T')[0];
    const todaysGainsKey = `todaysGains_${today}_${userId}`;
    
    try {
      localStorage.removeItem(todaysGainsKey);
      localStorage.removeItem(`highestBalance_${userId}`);
      
      // Réinitialiser également les clés génériques si c'est l'utilisateur actuel
      if (userId === this.userId) {
        this.resetBalance();
        localStorage.removeItem('currentBalance');
        localStorage.removeItem('lastKnownBalance');
      }
    } catch (e) {
      console.error("[BalanceManager] Failed to reset user data in localStorage:", e);
    }
  }
}

// Singleton pour être utilisé dans toute l'application
export const balanceManager = new BalanceManager();
