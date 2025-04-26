
import { getStorageKeys, persistBalance, getPersistedBalance } from './balanceStorage';

/**
 * Gestionnaire centralisé du solde utilisateur pour assurer la cohérence
 * entre les différentes parties de l'application
 */
class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private highestBalance: number = 0;
  private userId: string | null = null;
  
  constructor() {
    try {
      // Récupérer l'ID utilisateur depuis localStorage si disponible
      this.userId = localStorage.getItem('lastKnownUserId');
      
      // Initialiser avec les valeurs stockées
      this.initFromStorage();
    } catch (e) {
      console.error('Error initializing BalanceManager:', e);
    }
  }
  
  /**
   * Initialiser les valeurs depuis le stockage local
   */
  private initFromStorage(): void {
    try {
      // Utiliser des clés spécifiques à l'utilisateur si disponible
      const storedBalance = getPersistedBalance(this.userId);
      this.currentBalance = storedBalance;
      
      // Récupérer les gains journaliers
      const keys = getStorageKeys(this.userId);
      
      const storedDailyGains = localStorage.getItem(keys.dailyGains);
      if (storedDailyGains) {
        this.dailyGains = parseFloat(storedDailyGains);
      }
      
      // Récupérer le solde le plus élevé
      const storedHighestBalance = localStorage.getItem(keys.highestBalance);
      if (storedHighestBalance) {
        this.highestBalance = parseFloat(storedHighestBalance);
      } else {
        this.highestBalance = this.currentBalance;
      }
    } catch (e) {
      console.error('Error initializing from storage:', e);
    }
  }
  
  /**
   * Définir l'ID utilisateur actuel
   */
  public setUserId(userId: string | null): void {
    if (this.userId !== userId) {
      console.log(`Changing user ID: ${this.userId || 'none'} → ${userId || 'none'}`);
      this.userId = userId;
      
      // Sauvegarder l'ID utilisateur actuel
      if (userId) {
        localStorage.setItem('lastKnownUserId', userId);
      } else {
        localStorage.removeItem('lastKnownUserId');
      }
      
      // Réinitialiser le gestionnaire avec les valeurs spécifiques à cet utilisateur
      this.initFromStorage();
    }
  }
  
  /**
   * Obtenir l'ID utilisateur actuel
   */
  public getUserId(): string | null {
    return this.userId;
  }
  
  /**
   * Obtenir le solde actuel
   */
  public getCurrentBalance(): number {
    return this.currentBalance;
  }
  
  /**
   * Obtenir le solde le plus élevé
   */
  public getHighestBalance(): number {
    return this.highestBalance;
  }
  
  /**
   * Mettre à jour le solde
   */
  public updateBalance(amount: number, userId?: string | null): void {
    try {
      // Utiliser l'ID fourni ou l'ID stocké
      const effectiveUserId = userId || this.userId;
      
      // Si l'ID change, mettre à jour l'ID interne
      if (userId && userId !== this.userId) {
        this.setUserId(userId);
      }
      
      // Ajouter au solde actuel
      const newBalance = this.currentBalance + amount;
      this.currentBalance = newBalance;
      
      // Mettre à jour le solde le plus élevé si nécessaire
      if (newBalance > this.highestBalance) {
        this.highestBalance = newBalance;
        
        // Stocker le solde le plus élevé
        const keys = getStorageKeys(effectiveUserId);
        localStorage.setItem(keys.highestBalance, newBalance.toString());
      }
      
      // Mettre à jour les gains journaliers
      this.dailyGains += amount;
      
      // Persister les modifications
      persistBalance(newBalance, effectiveUserId);
      
      // Stocker les gains journaliers
      const keys = getStorageKeys(effectiveUserId);
      localStorage.setItem(keys.dailyGains, this.dailyGains.toString());
      
      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { 
          amount,
          newBalance,
          timestamp: Date.now(),
          userId: effectiveUserId
        } 
      }));
      
      console.log(`Balance updated: +${amount}€ = ${newBalance}€ (User: ${effectiveUserId || 'none'})`);
    } catch (e) {
      console.error('Error updating balance:', e);
    }
  }
  
  /**
   * Forcer la synchronisation du solde avec une valeur spécifique
   */
  public forceBalanceSync(newBalance: number, userId?: string | null): void {
    try {
      // Utiliser l'ID fourni ou l'ID stocké
      const effectiveUserId = userId || this.userId;
      
      // Si l'ID change, mettre à jour l'ID interne
      if (userId && userId !== this.userId) {
        this.setUserId(userId);
      }
      
      console.log(`Balance force synced: ${this.currentBalance} -> ${newBalance} (User: ${effectiveUserId || 'none'})`);
      
      // Mettre à jour le solde actuel
      this.currentBalance = newBalance;
      
      // Mettre à jour le solde le plus élevé si nécessaire
      if (newBalance > this.highestBalance) {
        this.highestBalance = newBalance;
        
        // Stocker le solde le plus élevé
        const keys = getStorageKeys(effectiveUserId);
        localStorage.setItem(keys.highestBalance, newBalance.toString());
      }
      
      // Persister les modifications
      persistBalance(newBalance, effectiveUserId);
      
      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('balance:force-update', { 
        detail: { 
          newBalance,
          timestamp: Date.now(),
          userId: effectiveUserId
        } 
      }));
    } catch (e) {
      console.error('Error force syncing balance:', e);
    }
  }
  
  /**
   * Définir les gains journaliers
   */
  public setDailyGains(amount: number): void {
    this.dailyGains = amount;
    
    // Stocker les gains journaliers
    const keys = getStorageKeys(this.userId);
    localStorage.setItem(keys.dailyGains, amount.toString());
  }
  
  /**
   * Obtenir les gains journaliers
   */
  public getDailyGains(): number {
    return this.dailyGains;
  }
  
  /**
   * Réinitialiser les gains journaliers
   */
  public resetDailyGains(): void {
    this.dailyGains = 0;
    
    // Stocker les gains journaliers
    const keys = getStorageKeys(this.userId);
    localStorage.setItem(keys.dailyGains, '0');
  }
}

// Exporter une instance unique
const balanceManager = new BalanceManager();
export default balanceManager;
