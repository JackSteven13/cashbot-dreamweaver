
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { getPersistedBalance, persistBalance, getStorageKeys } from './balanceStorage';
import { EventEmitter } from './eventEmitter';

class BalanceManager {
  private _currentBalance: number = 0;
  private _highestBalance: number = 0;
  private _dailyGains: number = 0;
  private _eventEmitter: EventEmitter = new EventEmitter();
  private _userId: string | null = null;
  
  constructor() {
    // Initialize values from local storage if available
    try {
      this.initFromLocalStorage();
    } catch (e) {
      console.error('Failed to initialize balance manager:', e);
    }
    
    // Reset daily gains at midnight
    this.setupDailyReset();
  }
  
  // Set the user ID for the current session
  setUserId(userId: string): void {
    if (this._userId === userId) return;
    
    console.log(`Setting user ID in balance manager: ${userId}`);
    this._userId = userId;
    
    // Re-initialize with user-specific data
    this.initFromLocalStorage();
    
    // Reset balance references
    window.dispatchEvent(new CustomEvent('balance:manager-user-change', {
      detail: { 
        userId,
        currentBalance: this._currentBalance,
        highestBalance: this._highestBalance,
        dailyGains: this._dailyGains
      }
    }));
  }
  
  private initFromLocalStorage(): void {
    // For balances, use user-specific keys
    const storedBalance = getPersistedBalance(this._userId);
    if (!isNaN(storedBalance)) {
      this._currentBalance = storedBalance;
    }
    
    // For highest balance, use user-specific key
    const keys = getStorageKeys(this._userId);
    const storedHighestBalance = localStorage.getItem(keys.highestBalance);
    if (storedHighestBalance) {
      this._highestBalance = parseFloat(storedHighestBalance);
    } else {
      this._highestBalance = this._currentBalance;
    }
    
    // For daily gains, use user-specific key
    const storedDailyGains = localStorage.getItem(keys.dailyGains);
    if (storedDailyGains) {
      this._dailyGains = parseFloat(storedDailyGains);
    } else {
      this._dailyGains = 0;
      this.setDailyGains(0); // Initialize in localStorage
    }
  }
  
  private setupDailyReset(): void {
    // Check if we need to reset daily gains
    const lastResetDate = localStorage.getItem('lastDailyReset');
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      this._dailyGains = 0;
      const keys = getStorageKeys(this._userId);
      localStorage.setItem(keys.dailyGains, '0');
      localStorage.setItem('lastDailyReset', today);
      
      // Clear all daily limit flags
      if (this._userId) {
        localStorage.removeItem(`freemium_daily_limit_reached_${this._userId}`);
      }
      
      // Also clear generic daily limit flags for safety
      localStorage.removeItem('freemium_daily_limit_reached');
      localStorage.removeItem('daily_session_count');
    }
    
    // Set up timer for next midnight
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this._dailyGains = 0;
      const keys = getStorageKeys(this._userId);
      localStorage.setItem(keys.dailyGains, '0');
      localStorage.setItem('lastDailyReset', new Date().toDateString());
      
      // Clear all daily limit flags
      if (this._userId) {
        localStorage.removeItem(`freemium_daily_limit_reached_${this._userId}`);
      }
      
      // Also clear generic daily limit flags for safety
      localStorage.removeItem('freemium_daily_limit_reached');
      localStorage.removeItem('daily_session_count');
      
      this.setupDailyReset(); // Set up the next day's reset
    }, timeUntilMidnight);
  }
  
  // Force-sync balance (used when there's a direct DB update)
  forceBalanceSync(balance: number, userId: string | null = null): void {
    // Use the specific userId if provided, otherwise use the class instance's userId
    const effectiveUserId = userId || this._userId;
    
    // Update internal state
    this._currentBalance = balance;
    
    // Update highest balance if needed
    if (balance > this._highestBalance) {
      this._highestBalance = balance;
    }
    
    // Store in localStorage using user-specific keys
    persistBalance(balance, effectiveUserId);
    
    // Also store highest balance in localStorage
    const keys = getStorageKeys(effectiveUserId);
    localStorage.setItem(keys.highestBalance, this._highestBalance.toString());
    
    // Emit balance changed event
    this._eventEmitter.emit('balance-changed', this._currentBalance);
    
    // Dispatch DOM event for components that listen to it
    window.dispatchEvent(new CustomEvent('balance:forced-sync', {
      detail: { 
        balance, 
        userId: effectiveUserId,
        timestamp: Date.now()
      }
    }));
  }
  
  // Update balance with a new transaction
  updateBalance(amount: number): boolean {
    // Verify we have a valid userId
    if (!this._userId) {
      console.error("Cannot update balance: no user ID set in balance manager");
      return false;
    }
    
    // NOUVEAU: Si c'est un compte freemium et un gain, vérifier que la limite quotidienne n'est pas dépassée
    if (amount > 0) {
      const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
      
      // Si c'est un gain et un compte freemium, appliquer une vérification stricte
      if (currentSubscription === 'freemium') {
        // Vérifier si l'ajout causerait un dépassement de la limite
        const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription] || 0.5;
        if (this._dailyGains + amount > dailyLimit) {
          console.error(`Gain quotidien rejeté: ${this._dailyGains + amount}€ > ${dailyLimit}€ (limite freemium)`);
          
          // Bloquer explicitement la mise à jour du solde
          localStorage.setItem(`freemium_daily_limit_reached_${this._userId}`, 'true');
          
          // Notification dans les logs pour débogage
          console.warn(`LIMITE QUOTIDIENNE ATTEINTE: Tentative de dépasser ${dailyLimit}€ pour ${this._userId}`);
          
          // Diffuser un événement de limite atteinte
          window.dispatchEvent(new CustomEvent('daily-limit:reached', {
            detail: { 
              userId: this._userId,
              currentGains: this._dailyGains,
              limit: dailyLimit
            }
          }));
          
          return false;
        }
      }
    }
    
    try {
      // Calculate new balance
      const newBalance = this._currentBalance + amount;
      
      // Update internal state
      this._currentBalance = newBalance;
      
      // Update highest balance if needed
      if (newBalance > this._highestBalance) {
        this._highestBalance = newBalance;
      }
      
      // Store in localStorage using user-specific keys
      persistBalance(newBalance, this._userId);
      
      // Also store highest balance in localStorage
      const keys = getStorageKeys(this._userId);
      localStorage.setItem(keys.highestBalance, this._highestBalance.toString());
      
      // Emit balance changed event
      this._eventEmitter.emit('balance-changed', this._currentBalance);
      
      return true;
    } catch (e) {
      console.error('Failed to update balance:', e);
      return false;
    }
  }
  
  // Add to daily gains and check if limit reached
  addDailyGain(amount: number): boolean {
    // Verify we have a valid userId for tracking daily gains
    if (!this._userId) {
      console.error("Cannot track daily gains: no user ID set in balance manager");
      return false;
    }
    
    try {
      // Get current subscription from localStorage
      const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
      
      // Get daily limit for the subscription
      const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Calculate new daily gains
      const newDailyGains = parseFloat((this._dailyGains + amount).toFixed(3));
      
      // RENFORCÉ: Vérification stricte de la limite quotidienne
      // Ne pas autoriser si le gain ferait dépasser la limite
      if (newDailyGains > dailyLimit) {
        console.error(`Gain quotidien refusé: tentative de dépasser la limite (${newDailyGains}€ > ${dailyLimit}€)`);
        
        // Marquer explicitement que la limite est atteinte pour ce compte
        localStorage.setItem(`freemium_daily_limit_reached_${this._userId}`, 'true');
        
        // Notification détaillée dans les logs pour le débogage
        console.warn(`LIMITE STRICTE: Tentative de gain de ${amount}€ refusée. Total serait ${newDailyGains}€ > limite ${dailyLimit}€`);
        
        // Événement pour mettre à jour l'interface
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: { 
            userId: this._userId,
            currentGains: this._dailyGains,
            attemptedGain: amount,
            limit: dailyLimit
          }
        }));
        
        return false;
      }
      
      // Vérification supplémentaire pour les freemium (80% de la limite)
      if (currentSubscription === 'freemium' && newDailyGains > dailyLimit * 0.8) {
        // Marquer comme proche de la limite
        console.log(`Approche de la limite quotidienne: ${newDailyGains}€/${dailyLimit}€`);
        
        // Pour les comptes freemium près de la limite, désactiver le bot
        if (newDailyGains > dailyLimit * 0.9) {
          window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
            detail: { active: false, reason: 'near_limit' } 
          }));
        }
      }
      
      // Update internal state
      this._dailyGains = newDailyGains;
      
      // Store in localStorage using user-specific keys
      const keys = getStorageKeys(this._userId);
      localStorage.setItem(keys.dailyGains, this._dailyGains.toString());
      
      return true;
    } catch (e) {
      console.error('Failed to add daily gain:', e);
      return false;
    }
  }
  
  // Get current balance
  getCurrentBalance(): number {
    return this._currentBalance;
  }
  
  // Get highest balance
  getHighestBalance(): number {
    return this._highestBalance;
  }
  
  // Update highest balance
  updateHighestBalance(balance: number): void {
    if (balance > this._highestBalance) {
      this._highestBalance = balance;
      
      // Store the updated highest balance in localStorage
      if (this._userId) {
        const keys = getStorageKeys(this._userId);
        localStorage.setItem(keys.highestBalance, this._highestBalance.toString());
      }
    }
  }
  
  // Get daily gains
  getDailyGains(): number {
    return this._dailyGains;
  }
  
  // Set daily gains (used for syncing with transaction history)
  setDailyGains(amount: number): void {
    // Validate userId to ensure user-specific storage
    if (!this._userId && amount > 0) {
      console.error("Cannot set daily gains: no user ID set in balance manager");
      return;
    }
    
    this._dailyGains = amount;
    
    // Store in localStorage using user-specific keys
    const keys = getStorageKeys(this._userId);
    localStorage.setItem(keys.dailyGains, amount.toString());
    
    // NOUVEAU: Vérifier si la limite est atteinte après la mise à jour
    const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Vérification immédiate si la limite est déjà dépassée
    if (amount >= dailyLimit) {
      console.warn(`LIMITE DÉJÀ DÉPASSÉE: Daily gains set to ${amount}€ >= limit ${dailyLimit}€`);
      
      if (this._userId) {
        localStorage.setItem(`freemium_daily_limit_reached_${this._userId}`, 'true');
      }
      
      // Diffuser l'événement de limite atteinte
      window.dispatchEvent(new CustomEvent('daily-limit:reached', {
        detail: { 
          userId: this._userId,
          currentGains: amount,
          limit: dailyLimit
        }
      }));
    }
  }
  
  // Sync daily gains from transactions
  syncDailyGainsFromTransactions(amount: number): void {
    this.setDailyGains(amount);
  }
  
  // Register a watcher for balance changes
  addWatcher(callback: (balance: number) => void): () => void {
    return this._eventEmitter.on('balance-changed', callback);
  }
  
  // Check if daily limit is reached
  isDailyLimitReached(subscription: string = 'freemium'): boolean {
    // Get current subscription if not provided
    const currentSubscription = subscription || localStorage.getItem('currentSubscription') || 'freemium';
    
    // Get daily limit for the subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // RENFORCEMENT: Vérification stricte à 100% de la limite, pas 90%
    return this._dailyGains >= dailyLimit;
  }
  
  // Get remaining daily allowance
  getRemainingDailyAllowance(subscription: string = 'freemium'): number {
    // Get current subscription if not provided
    const currentSubscription = subscription || localStorage.getItem('currentSubscription') || 'freemium';
    
    // Get daily limit for the subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Calculate remaining allowance
    const remaining = dailyLimit - this._dailyGains;
    
    // Return remaining, minimum 0
    return Math.max(0, remaining);
  }
  
  // DEBUG: Effacer le solde actuel (pour les tests)
  resetBalance(): boolean {
    if (!this._userId) {
      console.error("Cannot reset balance: no user ID set");
      return false;
    }
    
    try {
      // Reset balance values
      this._currentBalance = 0;
      
      // Store zeros in localStorage
      persistBalance(0, this._userId);
      
      console.log(`Balance reset to 0 for user ${this._userId}`);
      
      // Emit balance changed event
      this._eventEmitter.emit('balance-changed', 0);
      
      // Dispatch DOM event
      window.dispatchEvent(new CustomEvent('balance:forced-sync', {
        detail: { 
          balance: 0, 
          userId: this._userId,
          timestamp: Date.now()
        }
      }));
      
      return true;
    } catch (e) {
      console.error('Failed to reset balance:', e);
      return false;
    }
  }
}

// Export a singleton instance
const balanceManager = new BalanceManager();
export default balanceManager;
