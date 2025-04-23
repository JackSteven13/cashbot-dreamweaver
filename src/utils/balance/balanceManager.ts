
import { BalanceManagerState, BalanceWatcher } from './types';
import { getPersistedBalance, persistBalance } from './balanceStorage';
import { BalanceEventManager } from './balanceEvents';

class BalanceManager {
  private state: BalanceManagerState;
  private eventManager: BalanceEventManager;

  constructor() {
    this.state = {
      currentBalance: 0,
      highestBalance: 0,
      dailyGains: 0,
      userId: null
    };
    this.eventManager = new BalanceEventManager();
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    const storedBalance = getPersistedBalance(this.state.userId);
    this.state.currentBalance = storedBalance;
    
    const storedHighest = parseFloat(localStorage.getItem('highest_balance') || '0');
    this.state.highestBalance = !isNaN(storedHighest) ? storedHighest : 0;
    
    const storedDailyGains = parseFloat(localStorage.getItem('dailyGains') || '0');
    this.state.dailyGains = !isNaN(storedDailyGains) ? storedDailyGains : 0;
    
    console.log(`Balance Manager initialized: balance=${this.state.currentBalance}, daily gains=${this.state.dailyGains}`);
  }

  setUserId(userId: string): void {
    if (userId !== this.state.userId) {
      this.state.userId = userId;
      const userBalance = getPersistedBalance(userId);
      if (userBalance > 0) {
        this.state.currentBalance = userBalance;
        this.eventManager.notifyWatchers(userBalance);
      }
      persistBalance(this.state.currentBalance, userId);
    }
  }

  getCurrentBalance(): number {
    return this.state.currentBalance;
  }

  getHighestBalance(): number {
    return this.state.highestBalance;
  }

  getDailyGains(): number {
    return this.state.dailyGains;
  }

  updateBalance(amount: number): number {
    if (isNaN(amount)) {
      console.error("Invalid balance update amount:", amount);
      return this.state.currentBalance;
    }
    
    this.state.currentBalance += amount;
    this.state.currentBalance = parseFloat(this.state.currentBalance.toFixed(2));
    
    if (amount > 0) {
      this.state.dailyGains += amount;
      this.state.dailyGains = parseFloat(this.state.dailyGains.toFixed(2));
      localStorage.setItem('dailyGains', this.state.dailyGains.toString());
    }
    
    if (this.state.currentBalance > this.state.highestBalance) {
      this.updateHighestBalance(this.state.currentBalance);
    }
    
    persistBalance(this.state.currentBalance, this.state.userId);
    this.eventManager.notifyWatchers(this.state.currentBalance);
    
    return this.state.currentBalance;
  }

  forceBalanceSync(newBalance: number, userId?: string): void {
    if (userId) {
      this.setUserId(userId);
    }
    
    if (isNaN(newBalance)) {
      console.error("Invalid balance for sync:", newBalance);
      return;
    }
    
    this.state.currentBalance = parseFloat(newBalance.toFixed(2));
    
    if (this.state.currentBalance > this.state.highestBalance) {
      this.updateHighestBalance(this.state.currentBalance);
    }
    
    persistBalance(this.state.currentBalance, this.state.userId);
    this.eventManager.notifyWatchers(this.state.currentBalance);
    this.eventManager.dispatchBalanceUpdate(this.state.currentBalance, this.state.userId);
  }

  updateHighestBalance(balance: number): void {
    if (balance > this.state.highestBalance) {
      this.state.highestBalance = balance;
      localStorage.setItem('highest_balance', this.state.highestBalance.toString());
      
      if (this.state.userId) {
        localStorage.setItem(`highest_balance_${this.state.userId}`, this.state.highestBalance.toString());
      }
    }
  }

  addWatcher(callback: BalanceWatcher): () => void {
    return this.eventManager.addWatcher(callback);
  }

  checkForSignificantBalanceChange(newBalance: number): boolean {
    return Math.abs(newBalance - this.state.currentBalance) > 0.01;
  }
}

// Export singleton instance
const balanceManager = new BalanceManager();
export default balanceManager;
