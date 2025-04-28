
// This file contains a simplified implementation of the balance manager

import { BalanceManagerInstance } from '@/types/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

class BalanceManager implements BalanceManagerInstance {
  private balance: number = 0;
  private dailyGains: number = 0;
  private highestBalance: number = 0;
  private watcherCallbacks: ((balance: number) => void)[] = [];
  private userId: string | null = null;

  constructor() {
    this.loadFromLocalStorage();

    // Reset daily gains at midnight
    this.checkAndResetDailyGains();
  }

  private loadFromLocalStorage() {
    try {
      const storedUserId = localStorage.getItem('current_user_id');
      
      if (storedUserId) {
        this.userId = storedUserId;
        
        const storedBalance = localStorage.getItem(`balance_${storedUserId}`);
        const storedDailyGains = localStorage.getItem(`daily_gains_${storedUserId}`);
        const storedHighestBalance = localStorage.getItem(`highest_balance_${storedUserId}`);
        
        if (storedBalance) this.balance = parseFloat(storedBalance);
        if (storedDailyGains) this.dailyGains = parseFloat(storedDailyGains);
        if (storedHighestBalance) this.highestBalance = parseFloat(storedHighestBalance);
        
        console.log(`BalanceManager: données chargées pour ${storedUserId}`, {
          balance: this.balance,
          dailyGains: this.dailyGains,
          highestBalance: this.highestBalance,
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données du localStorage:", error);
    }
  }

  private saveToLocalStorage() {
    try {
      if (this.userId) {
        localStorage.setItem(`balance_${this.userId}`, this.balance.toString());
        localStorage.setItem(`daily_gains_${this.userId}`, this.dailyGains.toString());
        localStorage.setItem(`highest_balance_${this.userId}`, this.highestBalance.toString());
        
        console.log(`BalanceManager: données sauvegardées pour ${this.userId}`, {
          balance: this.balance,
          dailyGains: this.dailyGains,
          highestBalance: this.highestBalance,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données dans localStorage:", error);
    }
  }

  private notifyWatchers() {
    this.watcherCallbacks.forEach(callback => {
      try {
        callback(this.balance);
      } catch (error) {
        console.error("Erreur dans un watcher de balance:", error);
      }
    });
  }

  private checkAndResetDailyGains() {
    const now = new Date();
    const lastReset = localStorage.getItem('last_daily_reset');
    
    if (lastReset) {
      const lastResetDate = new Date(lastReset);
      
      // Vérifier si on est sur un nouveau jour
      if (
        now.getDate() !== lastResetDate.getDate() ||
        now.getMonth() !== lastResetDate.getMonth() ||
        now.getFullYear() !== lastResetDate.getFullYear()
      ) {
        console.log("BalanceManager: réinitialisation des gains quotidiens (nouveau jour)");
        this.resetDailyGains();
      }
    }
    
    // Sauvegarder la date de la dernière réinitialisation
    localStorage.setItem('last_daily_reset', now.toISOString());
  }

  // Public methods
  
  setUserId(userId: string) {
    if (this.userId !== userId) {
      this.userId = userId;
      this.loadFromLocalStorage();
      console.log(`BalanceManager: ID utilisateur défini sur ${userId}`);
    }
  }
  
  getUserId(): string | null {
    return this.userId;
  }

  getCurrentBalance(): number {
    return this.balance;
  }

  forceBalanceSync(newBalance: number, userId?: string) {
    if (userId) {
      this.userId = userId;
    }
    
    if (typeof newBalance === 'number' && !isNaN(newBalance) && newBalance >= 0) {
      this.balance = newBalance;
      if (newBalance > this.highestBalance) {
        this.highestBalance = newBalance;
      }
      this.saveToLocalStorage();
      this.notifyWatchers();
      console.log(`BalanceManager: synchronisation forcée du solde à ${newBalance}€`);
      return true;
    }
    return false;
  }

  updateBalance(amount: number): boolean {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error(`BalanceManager: tentative de mise à jour avec une valeur invalide: ${amount}`);
      return false;
    }
    
    // Pour les gains, vérifier que la limite quotidienne n'est pas dépassée
    if (amount > 0) {
      const subscription = localStorage.getItem(`subscription_${this.userId}`) || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Si ajout de ce gain dépasse la limite quotidienne, refuser la mise à jour
      if (this.dailyGains + amount > dailyLimit) {
        console.error(`Gain quotidien REJETÉ: ${this.dailyGains}€ + ${amount}€ = ${this.dailyGains + amount}€ > ${dailyLimit}€ (limite ${subscription})`);
        console.warn(`🛑 LIMITE QUOTIDIENNE STRICTEMENT RESPECTÉE: gain de ${amount}€ bloqué pour ${this.userId}`);
        return false;
      }
      
      // Si l'ajout est autorisé, mettre à jour le gain quotidien
      this.dailyGains += amount;
    }
    
    // Appliquer la modification de solde
    const oldBalance = this.balance;
    this.balance += amount;
    
    // Empêcher les soldes négatifs
    if (this.balance < 0) {
      this.balance = 0;
    }
    
    // Mettre à jour le solde max si nécessaire
    if (this.balance > this.highestBalance) {
      this.highestBalance = this.balance;
    }
    
    this.saveToLocalStorage();
    this.notifyWatchers();
    console.log(`BalanceManager: solde mis à jour de ${oldBalance}€ à ${this.balance}€ (${amount > 0 ? '+' : ''}${amount}€)`);
    return true;
  }

  getHighestBalance(): number {
    return this.highestBalance;
  }

  updateHighestBalance(balance: number): void {
    if (balance > this.highestBalance) {
      this.highestBalance = balance;
      this.saveToLocalStorage();
    }
  }

  getDailyGains(): number {
    return this.dailyGains;
  }

  setDailyGains(amount: number): void {
    if (typeof amount === 'number' && !isNaN(amount) && amount >= 0) {
      this.dailyGains = amount;
      this.saveToLocalStorage();
      console.log(`BalanceManager: gains quotidiens définis à ${amount}€`);
    }
  }

  addDailyGain(amount: number): boolean {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      console.error(`BalanceManager: tentative d'ajout d'un gain invalide: ${amount}`);
      return false;
    }
    
    // Vérifier les limites quotidiennes en fonction de l'abonnement
    const subscription = localStorage.getItem(`subscription_${this.userId}`) || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    if (this.dailyGains + amount > dailyLimit) {
      console.error(`BLOCAGE PRÉVENTIF: ${this.dailyGains}€ + ${amount}€ = ${this.dailyGains + amount}€ > ${dailyLimit}€`);
      console.warn(`🔒 PROTECTION STRICTE: Tentative de gain de ${amount}€ refusée. Total serait ${this.dailyGains + amount}€ > limite ${dailyLimit}€`);
      
      // Limiter strictement le gain pour ne pas dépasser la limite quotidienne
      if (dailyLimit > this.dailyGains) {
        const adjustedAmount = Number((dailyLimit - this.dailyGains).toFixed(2));
        console.log(`Ajustement du gain à ${adjustedAmount}€ pour respecter la limite quotidienne`);
        this.dailyGains = dailyLimit;
        this.saveToLocalStorage();
        return true;
      }
      return false;
    }
    
    // Mettre à jour les gains quotidiens
    this.dailyGains += amount;
    this.saveToLocalStorage();
    console.log(`BalanceManager: gain quotidien ajouté: +${amount}€, total: ${this.dailyGains}€`);
    return true;
  }

  syncDailyGainsFromTransactions(amount: number): void {
    if (typeof amount === 'number' && !isNaN(amount) && amount >= 0) {
      this.dailyGains = amount;
      this.saveToLocalStorage();
      console.log(`BalanceManager: gains quotidiens synchronisés depuis les transactions: ${amount}€`);
    }
  }

  resetDailyGains(): void {
    this.dailyGains = 0;
    this.saveToLocalStorage();
    
    // Réinitialiser également les drapeaux de limite atteinte
    if (this.userId) {
      localStorage.removeItem(`daily_limit_reached_${this.userId}`);
      localStorage.removeItem(`freemium_daily_limit_reached_${this.userId}`);
      
      console.log(`BalanceManager: gains quotidiens et limites réinitialisés pour ${this.userId}`);
    }
  }

  resetBalance(): boolean {
    this.balance = 0;
    this.saveToLocalStorage();
    this.notifyWatchers();
    console.log("BalanceManager: solde réinitialisé à 0€");
    return true;
  }

  addWatcher(callback: (newBalance: number) => void): () => void {
    this.watcherCallbacks.push(callback);
    
    // Appeler le watcher immédiatement avec le solde actuel
    try {
      callback(this.balance);
    } catch (error) {
      console.error("Erreur lors de l'initialisation du watcher:", error);
    }
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.watcherCallbacks = this.watcherCallbacks.filter(cb => cb !== callback);
    };
  }
  
  // Vérifier si la limite quotidienne est atteinte
  isDailyLimitReached(subscription: string): boolean {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    return this.dailyGains >= dailyLimit;
  }
  
  // Obtenir le montant restant disponible pour la journée
  getRemainingDailyAllowance(subscription: string): number {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    const remaining = Math.max(0, dailyLimit - this.dailyGains);
    return parseFloat(remaining.toFixed(2));
  }
  
  // Valider un gain par rapport à la limite quotidienne
  validateGainAgainstDailyLimit(amount: number, subscription: string): { allowed: boolean; adjustedAmount: number } {
    if (amount <= 0) {
      return { allowed: false, adjustedAmount: 0 };
    }
    
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Si la limite est déjà atteinte
    if (this.dailyGains >= dailyLimit) {
      return { allowed: false, adjustedAmount: 0 };
    }
    
    // Si le gain ferait dépasser la limite
    if (this.dailyGains + amount > dailyLimit) {
      const adjustedAmount = parseFloat((dailyLimit - this.dailyGains).toFixed(2));
      return { allowed: true, adjustedAmount };
    }
    
    // Si tout est OK
    return { allowed: true, adjustedAmount: amount };
  }
  
  checkForSignificantBalanceChange(newBalance: number): boolean {
    return Math.abs(newBalance - this.balance) > 0.01;
  }
}

// Exporter une instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;
