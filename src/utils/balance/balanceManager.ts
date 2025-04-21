
import { BalanceWatcher } from './types';
import { persistBalance, getPersistedBalance } from './balanceStorage';
import { emitBalanceUpdate, emitBalanceSync, emitSignificantChange } from './balanceEvents';

class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private watchers: BalanceWatcher[] = [];
  private userIds: Set<string> = new Set();
  private initialized: boolean = false;
  private lastUpdateTime: number = 0;
  private highestBalanceKey = 'highest_balance';
  private dailyGainsKey = 'daily_gains';
  private currentUserId: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    
    try {
      const persistedBalance = getPersistedBalance();
      const storedDailyGains = localStorage.getItem(this.dailyGainsKey);
      
      if (storedDailyGains) {
        const gains = parseFloat(storedDailyGains);
        if (!isNaN(gains)) {
          this.dailyGains = gains;
        }
      }

      this.currentBalance = persistedBalance;
      this.initialized = true;
      this.lastUpdateTime = Date.now();
      
      this.persistBalance();
      this.updateHighestBalance(this.currentBalance);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('balance:initialized', {
          detail: { balance: this.currentBalance }
        }));
      }, 100);
    } catch (e) {
      console.error("Error initializing BalanceManager:", e);
    }
  }

  getCurrentBalance(userId?: string): number {
    return this.currentBalance;
  }

  getDailyGains(): number {
    return this.dailyGains;
  }

  // Ajout des méthodes manquantes qui ont causé les erreurs
  addDailyGain(gain: number): void {
    if (isNaN(gain) || gain <= 0) return;
    
    this.dailyGains += gain;
    localStorage.setItem(this.dailyGainsKey, this.dailyGains.toString());
  }
  
  setDailyGains(gains: number): void {
    if (isNaN(gains) || gains < 0) return;
    
    this.dailyGains = gains;
    localStorage.setItem(this.dailyGainsKey, gains.toString());
  }
  
  resetDailyGains(): void {
    this.dailyGains = 0;
    localStorage.setItem(this.dailyGainsKey, '0');
  }
  
  setUserId(userId: string | null): void {
    if (!userId) return;
    
    this.currentUserId = userId;
    this.userIds.add(userId);
  }
  
  cleanupUserBalanceData(): void {
    this.userIds.clear();
    this.currentUserId = null;
  }

  updateBalance(newBalance: number) {
    if (newBalance < 0 || isNaN(newBalance)) {
      console.warn("Invalid balance update value:", newBalance);
      return;
    }

    if (Math.abs(this.currentBalance - newBalance) < 0.01) return;

    this.currentBalance = parseFloat(newBalance.toFixed(2));
    this.persistBalance();
    this.watchers.forEach(watcher => watcher(this.currentBalance));
  }

  forceBalanceSync(balance: number, userId?: string) {
    if (typeof balance !== 'number' || isNaN(balance) || balance < 0) {
      console.warn("Invalid balance for force sync:", balance);
      return;
    }

    if (userId) {
      this.userIds.add(userId);
    }

    if (balance > this.currentBalance) {
      this.updateBalance(balance);
      emitBalanceUpdate({ newBalance: this.currentBalance, userId: Array.from(this.userIds)[0] || null });
    }
  }

  addWatcher(watcher: BalanceWatcher) {
    this.watchers.push(watcher);
    watcher(this.currentBalance);
    return () => {
      this.watchers = this.watchers.filter(w => w !== watcher);
    };
  }

  getHighestBalance(userId?: string): number {
    try {
      const storedHighest = localStorage.getItem(this.highestBalanceKey);
      return storedHighest ? parseFloat(storedHighest) : this.currentBalance;
    } catch (e) {
      return this.currentBalance;
    }
  }

  updateHighestBalance(balance: number, userId?: string): void {
    if (isNaN(balance) || balance < 0) return;
    
    const current = this.getHighestBalance();
    if (balance > current) {
      localStorage.setItem(this.highestBalanceKey, balance.toString());
    }
  }

  checkForSignificantBalanceChange(serverBalance: number, userId?: string): void {
    if (!serverBalance || isNaN(serverBalance)) return;

    const difference = Math.abs(this.currentBalance - serverBalance);
    const threshold = 0.5;

    if (difference > threshold) {
      const highestBalance = Math.max(this.currentBalance, serverBalance);
      
      if (highestBalance !== this.currentBalance) {
        this.updateBalance(highestBalance);
      }

      emitSignificantChange(this.currentBalance, serverBalance, highestBalance);
    }
  }

  private persistBalance() {
    persistBalance(this.currentBalance, Array.from(this.userIds)[0]);
    this.lastUpdateTime = Date.now();
    this.updateHighestBalance(this.currentBalance);
  }

  reset() {
    this.currentBalance = 0;
    this.dailyGains = 0;
    this.watchers = [];
    this.userIds = new Set();
    this.initialized = false;
    this.lastUpdateTime = 0;

    localStorage.removeItem(this.highestBalanceKey);
    localStorage.removeItem(this.dailyGainsKey);
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');

    this.init();
  }
}

const balanceManager = new BalanceManager();
export default balanceManager;
