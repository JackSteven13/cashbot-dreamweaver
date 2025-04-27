import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { getPersistedBalance, persistBalance, getStorageKeys } from './balanceStorage';
import { EventEmitter } from './eventEmitter';

class BalanceManager {
  private _currentBalance: number = 0;
  private _highestBalance: number = 0;
  private _dailyGains: number = 0;
  private _eventEmitter: EventEmitter = new EventEmitter();
  private _userId: string | null = null;
  private _lastVerifiedDate: string = '';
  private _limitCache: Map<string, boolean> = new Map(); // Cache for limit checks
  
  constructor() {
    // Initialize values from local storage if available
    try {
      this.initFromLocalStorage();
    } catch (e) {
      console.error('Failed to initialize balance manager:', e);
    }
    
    // Reset daily gains at midnight
    this.setupDailyReset();
    
    // Set up limit check listener
    this.setupLimitCheckListener();
  }
  
  // New method: Set up a global limit check listener
  private setupLimitCheckListener() {
    window.addEventListener('daily-limit:check-all', () => {
      // Force a check if we have a userId
      if (this._userId) {
        const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
        const isLimitReached = this.isDailyLimitReached(currentSubscription);
        
        if (isLimitReached) {
          // Broadcast limit reached event
          window.dispatchEvent(new CustomEvent('daily-limit:reached', {
            detail: { 
              userId: this._userId,
              currentGains: this._dailyGains,
              limit: SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5,
              source: 'global_check'
            }
          }));
          
          // Mark the limit as reached in localStorage
          localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
        }
      }
    });
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
    
    // Check limits immediately after user change
    this.checkAndEnforceDailyLimits();
  }
  
  // Get user ID
  getUserId(): string | null {
    return this._userId;
  }
  
  // CRITICAL: Check and enforce daily limits
  private checkAndEnforceDailyLimits(): void {
    if (!this._userId) return;
    
    const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // If we've already reached the limit, mark it
    if (this._dailyGains >= dailyLimit * 0.999) {
      console.warn(`LIMITE QUOTIDIENNE ATTEINTE: ${this._dailyGains}€ >= ${dailyLimit}€`);
      
      // Strict limit enforcement
      localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
      localStorage.setItem(`freemium_daily_limit_reached_${this._userId}`, 'true');
      
      // Cache the result
      this._limitCache.set(currentSubscription, true);
      
      // Broadcast the event
      window.dispatchEvent(new CustomEvent('daily-limit:reached', {
        detail: { 
          userId: this._userId,
          currentGains: this._dailyGains,
          limit: dailyLimit,
          source: 'checkAndEnforceDailyLimits'
        }
      }));
    }
  }
  
  // OPTIMISÉ: Charger les données spécifiques à l'utilisateur
  private initFromLocalStorage(): void {
    // Vérifier d'abord si nous avons un ID utilisateur
    if (!this._userId) {
      console.log('Aucun ID utilisateur défini, utilisation des données génériques');
      return;
    }
    
    try {
      // Pour balances, use user-specific keys
      const storedBalance = getPersistedBalance(this._userId);
      if (!isNaN(storedBalance)) {
        this._currentBalance = storedBalance;
      }
      
      // Pour highest balance, use user-specific key
      const keys = getStorageKeys(this._userId);
      const storedHighestBalance = localStorage.getItem(keys.highestBalance);
      if (storedHighestBalance) {
        this._highestBalance = parseFloat(storedHighestBalance);
      } else {
        this._highestBalance = this._currentBalance;
      }
      
      // Pour daily gains, use user-specific key et assurer qu'on reset chaque jour
      const storedDailyGains = localStorage.getItem(keys.dailyGains);
      const today = new Date().toDateString();
      const lastGainsDate = localStorage.getItem(`lastGainsDate_${this._userId}`) || '';
      
      if (storedDailyGains && lastGainsDate === today) {
        // Uniquement utiliser les gains stockés si c'est du même jour
        this._dailyGains = parseFloat(storedDailyGains);
        
        // AJOUT: Vérification supplémentaire pour éviter les valeurs invalides
        if (isNaN(this._dailyGains) || this._dailyGains < 0) {
          this._dailyGains = 0;
          localStorage.setItem(keys.dailyGains, '0');
        }
      } else {
        // Sinon réinitialiser les gains quotidiens
        this._dailyGains = 0;
        this.setDailyGains(0); // Initialize in localStorage with user ID
        localStorage.setItem(`lastGainsDate_${this._userId}`, today);
        
        // Reset all daily limit flags for this user
        localStorage.removeItem(`freemium_daily_limit_reached_${this._userId}`);
        localStorage.removeItem(`daily_limit_reached_${this._userId}`);
        localStorage.removeItem(`last_session_date_${this._userId}`);
      }
      
      // Store the date we verified
      this._lastVerifiedDate = today;
      
      // Check limits immediately after initialization
      this.checkAndEnforceDailyLimits();
    } catch (e) {
      console.error(`Erreur lors de l'initialisation des données pour l'utilisateur ${this._userId}:`, e);
    }
  }
  
  // RENFORCÉ: Réinitialisation quotidienne plus robuste
  private setupDailyReset(): void {
    // Check if we need to reset daily gains
    const today = new Date().toDateString();
    
    if (this._lastVerifiedDate !== today) {
      this._dailyGains = 0;
      
      // Si on a un ID utilisateur, reset ses données spécifiques
      if (this._userId) {
        const keys = getStorageKeys(this._userId);
        localStorage.setItem(keys.dailyGains, '0');
        localStorage.setItem(`lastGainsDate_${this._userId}`, today);
        
        // Clear all daily limit flags for this user
        localStorage.removeItem(`freemium_daily_limit_reached_${this._userId}`);
        localStorage.removeItem(`daily_limit_reached_${this._userId}`);
        localStorage.removeItem(`last_session_date_${this._userId}`);
        
        // Clear limit cache
        this._limitCache.clear();
      }
      
      this._lastVerifiedDate = today;
    }
    
    // Set up timer for next midnight
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this._dailyGains = 0;
      
      // Reset pour utilisateur spécifique si disponible
      if (this._userId) {
        const keys = getStorageKeys(this._userId);
        localStorage.setItem(keys.dailyGains, '0');
        localStorage.setItem(`lastGainsDate_${this._userId}`, new Date().toDateString());
        
        // Clear all daily limit flags for this user
        localStorage.removeItem(`freemium_daily_limit_reached_${this._userId}`);
        localStorage.removeItem(`daily_limit_reached_${this._userId}`);
        localStorage.removeItem(`last_session_date_${this._userId}`);
        
        // Clear limit cache
        this._limitCache.clear();
      }
      
      // Update the verified date
      this._lastVerifiedDate = new Date().toDateString();
      
      // Broadcast the reset event
      window.dispatchEvent(new CustomEvent('daily:reset', {
        detail: {
          userId: this._userId,
          timestamp: Date.now()
        }
      }));
      
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
  
  // RENFORCÉ: Mise à jour du solde avec vérification stricte des limites
  updateBalance(amount: number): boolean {
    // Verify we have a valid userId
    if (!this._userId) {
      console.error("Cannot update balance: no user ID set in balance manager");
      return false;
    }
    
    // RENFORCÉ: Si c'est un gain, vérifier STRICTEMENT que la limite quotidienne n'est pas dépassée
    if (amount > 0) {
      const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
      
      // PROTECTION ABSOLUE: Vérifier d'abord si la limite est déjà atteinte
      const isLimitAlreadyReached = this.isDailyLimitReached(currentSubscription);
      if (isLimitAlreadyReached) {
        console.error(`🛑 MISE À JOUR BLOQUÉE: Limite quotidienne déjà atteinte (${this._dailyGains.toFixed(2)}€)`);
        
        // Marquer explicitement que la limite est atteinte
        localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
        
        // Diffuser un événement de limite atteinte
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: { 
            userId: this._userId,
            currentGains: this._dailyGains,
            attemptedGain: amount,
            blocked: true
          }
        }));
        
        return false;
      }
      
      // Vérification stricte pour tout type de compte
      // Vérifier si l'ajout causerait un dépassement de la limite
      const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      if (this._dailyGains + amount > dailyLimit) {
        console.error(`Gain quotidien REJETÉ: ${this._dailyGains}€ + ${amount}€ = ${this._dailyGains + amount}€ > ${dailyLimit}€ (limite ${currentSubscription})`);
        
        // Bloquer explicitement la mise à jour du solde
        localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
        
        // Avertissement visible dans les logs
        console.warn(`🛑 LIMITE QUOTIDIENNE STRICTEMENT RESPECTÉE: gain de ${amount}€ bloqué pour ${this._userId}`);
        
        // Diffuser un événement de limite atteinte
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
      
      // Si c'est un gain, l'ajouter aux gains quotidiens
      if (amount > 0) {
        this._dailyGains = parseFloat((this._dailyGains + amount).toFixed(2));
        localStorage.setItem(keys.dailyGains, this._dailyGains.toString());
        
        // Update cache to force fresh limit checks
        this._limitCache.clear();
        
        // Check if we're approaching the limit
        const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
        const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        
        // If we're at 90% of the limit, trigger an approaching event
        if (this._dailyGains >= dailyLimit * 0.9) {
          window.dispatchEvent(new CustomEvent('daily-limit:approaching', {
            detail: {
              userId: this._userId,
              currentGains: this._dailyGains,
              limit: dailyLimit,
              percentage: this._dailyGains / dailyLimit
            }
          }));
        }
        
        // If we've reached the limit, mark it
        if (this._dailyGains >= dailyLimit * 0.999) {
          localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
          
          window.dispatchEvent(new CustomEvent('daily-limit:reached', {
            detail: {
              userId: this._userId,
              currentGains: this._dailyGains,
              limit: dailyLimit
            }
          }));
        }
      }
      
      // Emit balance changed event
      this._eventEmitter.emit('balance-changed', this._currentBalance);
      
      return true;
    } catch (e) {
      console.error('Failed to update balance:', e);
      return false;
    }
  }
  
  // NOUVEAU: Reset daily gains (for admin/testing)
  resetDailyGains(): void {
    if (!this._userId) {
      console.error("Cannot reset daily gains: no user ID set in balance manager");
      return;
    }
    
    this._dailyGains = 0;
    const keys = getStorageKeys(this._userId);
    localStorage.setItem(keys.dailyGains, '0');
    localStorage.setItem(`lastGainsDate_${this._userId}`, new Date().toDateString());
    
    // Clear all daily limit flags for this user
    localStorage.removeItem(`freemium_daily_limit_reached_${this._userId}`);
    localStorage.removeItem(`daily_limit_reached_${this._userId}`);
    
    // Clear limit cache
    this._limitCache.clear();
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('daily-gains:reset', {
      detail: {
        userId: this._userId,
        timestamp: Date.now()
      }
    }));
  }
  
  // RENFORCÉ: Ajout aux gains quotidiens avec vérification très stricte
  addDailyGain(amount: number): boolean {
    // Verify we have a valid userId for tracking daily gains
    if (!this._userId) {
      console.error("Cannot track daily gains: no user ID set in balance manager");
      return false;
    }
    
    try {
      // Get current subscription from localStorage
      const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
      
      // PROTECTION ABSOLUE: Vérifier d'abord si la limite est déjà atteinte
      const isLimitAlreadyReached = this.isDailyLimitReached(currentSubscription);
      if (isLimitAlreadyReached) {
        console.error(`🛑 AJOUT BLOQUÉ: Limite quotidienne déjà atteinte (${this._dailyGains.toFixed(2)}€)`);
        
        // Marquer explicitement que la limite est atteinte
        localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
        localStorage.setItem(`last_session_date_${this._userId}`, new Date().toDateString());
        
        return false;
      }
      
      // Get daily limit for the subscription
      const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // PROTECTION ANTI-DÉPASSEMENT: Vérifier si nous avons déjà atteint la limite
      if (this._dailyGains >= dailyLimit) {
        console.error(`Limite quotidienne déjà atteinte: ${this._dailyGains}€ >= ${dailyLimit}€`);
        
        // Marquer explicitement que la limite est atteinte
        localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
        
        // Vérifier au centième près si nécessaire
        const preciseGains = parseFloat(this._dailyGains.toFixed(2));
        const preciseLimit = parseFloat(dailyLimit.toFixed(2));
        
        if (preciseGains < preciseLimit) {
          console.log(`Correction précise: ${preciseGains}€ < ${preciseLimit}€, mais blocage maintenu par sécurité`);
        }
        
        // Notification bloquante
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: { 
            userId: this._userId,
            currentGains: this._dailyGains,
            limit: dailyLimit,
            precise: true
          }
        }));
        
        return false;
      }
      
      // Calculate new daily gains (TRÈS précis jusqu'à 3 décimales)
      const newDailyGains = parseFloat((this._dailyGains + amount).toFixed(3));
      
      // RENFORCÉ: Re-vérification avant modification
      if (newDailyGains > dailyLimit) {
        console.error(`BLOCAGE PRÉVENTIF: ${this._dailyGains}€ + ${amount}€ = ${newDailyGains}€ > ${dailyLimit}€`);
        
        // Marquer explicitement que la limite est atteinte
        localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
        localStorage.setItem(`last_session_date_${this._userId}`, new Date().toDateString());
        
        // Notification très détaillée dans les logs
        console.warn(`🔒 PROTECTION STRICTE: Tentative de gain de ${amount}€ refusée. Total serait ${newDailyGains}€ > limite ${dailyLimit}€`);
        
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
      
      // Vérification supplémentaire pour les freemium (approche de limite)
      if (currentSubscription === 'freemium' && newDailyGains > dailyLimit * 0.9) {
        // Marquer comme proche de la limite
        console.log(`⚠️ Approche de la limite quotidienne: ${newDailyGains}€/${dailyLimit}€ (${(newDailyGains/dailyLimit*100).toFixed(1)}%)`);
        
        // Pour les comptes freemium très près de la limite (95%), désactiver le bot
        if (newDailyGains > dailyLimit * 0.95) {
          console.log("🤖 Désactivation préventive du bot (proche de la limite)");
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
      localStorage.setItem(`lastGainsDate_${this._userId}`, new Date().toDateString());
      
      // Clear limit cache to force fresh checks
      this._limitCache.clear();
      
      // Si on approche de la limite, lancer un événement
      if (this._dailyGains >= dailyLimit * 0.9) {
        window.dispatchEvent(new CustomEvent('daily-limit:approaching', {
          detail: { 
            userId: this._userId,
            currentGains: this._dailyGains,
            limit: dailyLimit,
            percentage: (this._dailyGains / dailyLimit)
          }
        }));
      }
      
      // Si la limite est atteinte exactement, marquer comme atteinte
      if (this._dailyGains >= dailyLimit * 0.999) {
        localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
        
        // Diffuser l'événement de limite atteinte
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: { 
            userId: this._userId,
            currentGains: this._dailyGains,
            limit: dailyLimit,
            source: 'addDailyGain'
          }
        }));
      }
      
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
  
  // Sync daily gains from transaction history
  syncDailyGainsFromTransactions(amount: number): void {
    // Validate userId to ensure user-specific storage
    if (!this._userId && amount > 0) {
      console.error("Cannot sync daily gains: no user ID set in balance manager");
      return;
    }

    // Only update if the amount is valid and different from current value
    if (!isNaN(amount) && amount >= 0 && this._dailyGains !== amount) {
      console.log(`Syncing daily gains from transactions: ${this._dailyGains}€ -> ${amount}€`);
      
      // Vérifier strictement la limite
      const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Si le montant des transactions dépasse la limite, utiliser la limite comme montant maximum
      const enforcedAmount = Math.min(amount, dailyLimit * 0.999);
      
      this._dailyGains = enforcedAmount;
      
      // Store in localStorage using user-specific keys if we have a userId
      if (this._userId) {
        const keys = getStorageKeys(this._userId);
        localStorage.setItem(keys.dailyGains, enforcedAmount.toString());
        localStorage.setItem(`lastGainsDate_${this._userId}`, new Date().toDateString());
        
        // Clear limit cache to force fresh checks
        this._limitCache.clear();
        
        // RENFORCÉ: Vérifier si la limite est atteinte après la mise à jour
        
        // Vérification immédiate si la limite est déjà dépassée
        if (enforcedAmount >= dailyLimit * 0.999) { // 99.9% de la limite
          console.warn(`⚠️ LIMITE DÉJÀ ATTEINTE: Daily gains synced to ${enforcedAmount}€ >= limit ${dailyLimit}€`);
          
          localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
          
          // Diffuser l'événement de limite atteinte
          window.dispatchEvent(new CustomEvent('daily-limit:reached', {
            detail: { 
              userId: this._userId,
              currentGains: enforcedAmount,
              limit: dailyLimit,
              source: 'syncDailyGainsFromTransactions'
            }
          }));
        }
      }
    }
  }
  
  // Get daily gains
  getDailyGains(): number {
    // RENFORCÉ: Vérifier si nous devons réinitialiser les gains (nouveau jour)
    const today = new Date().toDateString();
    if (this._userId && this._lastVerifiedDate !== today) {
      // C'est un nouveau jour, réinitialiser
      console.log("Nouveau jour détecté, réinitialisation des gains quotidiens");
      this._dailyGains = 0;
      const keys = getStorageKeys(this._userId);
      localStorage.setItem(keys.dailyGains, '0');
      localStorage.setItem(`lastGainsDate_${this._userId}`, today);
      
      // Réinitialiser aussi les drapeaux de limite
      localStorage.removeItem(`freemium_daily_limit_reached_${this._userId}`);
      localStorage.removeItem(`daily_limit_reached_${this._userId}`);
      localStorage.removeItem(`last_session_date_${this._userId}`);
      
      // Clear limit cache
      this._limitCache.clear();
      
      // Mettre à jour la date vérifiée
      this._lastVerifiedDate = today;
    }
    
    return this._dailyGains;
  }
  
  // Set daily gains (used for syncing with transaction history)
  setDailyGains(amount: number): void {
    // Validate userId to ensure user-specific storage
    if (!this._userId && amount > 0) {
      console.error("Cannot set daily gains: no user ID set in balance manager");
      return;
    }
    
    // NOUVEAU: Vérifier la limite applicable et restreindre le montant si nécessaire
    const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Appliquer strictement la limite
    const enforcedAmount = Math.min(amount, dailyLimit * 0.999);
    
    // Si le montant est réduit, logger l'information
    if (enforcedAmount < amount) {
      console.warn(`⚠️ RESTRICTION DE GAINS: ${amount}€ -> ${enforcedAmount}€ (limite ${dailyLimit}€)`);
    }
    
    this._dailyGains = enforcedAmount;
    
    // Store in localStorage using user-specific keys if we have a userId
    if (this._userId) {
      const keys = getStorageKeys(this._userId);
      localStorage.setItem(keys.dailyGains, enforcedAmount.toString());
      localStorage.setItem(`lastGainsDate_${this._userId}`, new Date().toDateString());
      
      // Clear limit cache
      this._limitCache.clear();
      
      // RENFORCÉ: Vérifier si la limite est atteinte après la mise à jour
      
      // Vérification immédiate si la limite est déjà dépassée
      if (enforcedAmount >= dailyLimit * 0.999) { // 99.9% de la limite
        console.warn(`⚠️ LIMITE DÉJÀ ATTEINTE: Daily gains set to ${enforcedAmount}€ >= limit ${dailyLimit}€`);
        
        localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
        
        // Diffuser l'événement de limite atteinte
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: { 
            userId: this._userId,
            currentGains: enforcedAmount,
            limit: dailyLimit,
            source: 'setDailyGains'
          }
        }));
      }
    }
  }
  
  // Register a watcher for balance changes
  addWatcher(callback: (balance: number) => void): () => void {
    return this._eventEmitter.on('balance-changed', callback);
  }
  
  // OPTIMISÉ: Vérifier strictement si la limite quotidienne est atteinte
  isDailyLimitReached(subscription: string = 'freemium'): boolean {
    // Check cache first
    if (this._limitCache.has(subscription)) {
      return this._limitCache.get(subscription) || false;
    }
    
    // Get current subscription if not provided
    const currentSubscription = subscription || localStorage.getItem('currentSubscription') || 'freemium';
    
    // Get daily limit for the subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // RENFORCEMENT: Vérification stricte à 100% (0.999 pour éviter les erreurs d'arrondi)
    const result = this._dailyGains >= dailyLimit * 0.999;
    
    // Cache the result
    this._limitCache.set(subscription, result);
    
    // If we have a userId and the limit is reached, set the flag in localStorage
    if (result && this._userId) {
      localStorage.setItem(`daily_limit_reached_${this._userId}`, 'true');
      
      // For freemium, also set the freemium-specific flag
      if (currentSubscription === 'freemium') {
        localStorage.setItem(`freemium_daily_limit_reached_${this._userId}`, 'true');
      }
    }
    
    return result;
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
  
  // NOUVEAU: Validate gain amount against daily limit
  validateGainAgainstDailyLimit(amount: number, subscription: string = 'freemium'): { allowed: boolean; adjustedAmount: number } {
    if (!this._userId || amount <= 0) {
      return { allowed: false, adjustedAmount: 0 };
    }
    
    const currentSubscription = subscription || localStorage.getItem('currentSubscription') || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // If we've already reached the limit, reject immediately
    if (this.isDailyLimitReached(currentSubscription)) {
      return { allowed: false, adjustedAmount: 0 };
    }
    
    // Calculate how much we can still gain today
    const remainingAllowance = Math.max(0, dailyLimit - this._dailyGains);
    
    // If the amount would exceed our remaining allowance
    if (amount > remainingAllowance) {
      // If we have at least some allowance left, allow a reduced amount
      if (remainingAllowance > 0) {
        const adjustedAmount = parseFloat(remainingAllowance.toFixed(2));
        return { allowed: true, adjustedAmount };
      }
      
      // Otherwise reject
      return { allowed: false, adjustedAmount: 0 };
    }
    
    // Amount is within limits
    return { allowed: true, adjustedAmount: amount };
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
