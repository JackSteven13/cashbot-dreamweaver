
import { persistToLocalStorage, getFromLocalStorage } from '../storage/localStorageUtils';

export class DailyGainsManager {
  private dailyGains: number = 0;
  private userId: string | null = null;
  private lastResetDate: string = '';
  
  constructor(userId: string | null = null) {
    this.userId = userId;
    this.loadDailyGains();
    this.checkForDayChange();
  }
  
  private loadDailyGains(): void {
    try {
      const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
      const storedDailyGains = getFromLocalStorage(storageKey, '0');
      if (storedDailyGains !== null) {
        this.dailyGains = parseFloat(storedDailyGains);
      }
      
      // Also load the last reset date
      const lastResetKey = this.userId ? `lastResetDate_${this.userId}` : 'lastResetDate';
      this.lastResetDate = getFromLocalStorage(lastResetKey, this.getCurrentDateString());
    } catch (e) {
      console.error('Failed to load daily gains:', e);
    }
  }
  
  private getCurrentDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  
  private checkForDayChange(): void {
    const currentDate = this.getCurrentDateString();
    if (this.lastResetDate !== currentDate) {
      console.log(`Day change detected: ${this.lastResetDate} -> ${currentDate}. Resetting daily gains.`);
      this.resetDailyGains();
      
      // Update the last reset date
      const lastResetKey = this.userId ? `lastResetDate_${this.userId}` : 'lastResetDate';
      persistToLocalStorage(lastResetKey, currentDate);
      this.lastResetDate = currentDate;
    }
  }
  
  getDailyGains(): number {
    // Always check for day change when getting daily gains
    this.checkForDayChange();
    return this.dailyGains;
  }
  
  setDailyGains(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to setDailyGains:', amount);
      return;
    }
    
    this.checkForDayChange(); // Check for day change before setting
    
    this.dailyGains = amount;
    const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
    persistToLocalStorage(storageKey, amount.toString());
    console.log(`Daily gains set to ${amount}`);
  }
  
  addDailyGain(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to addDailyGain:', amount);
      return;
    }
    
    this.checkForDayChange(); // Check for day change before adding
    
    this.dailyGains += amount;
    const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
    persistToLocalStorage(storageKey, this.dailyGains.toString());
    console.log(`Daily gains increased by ${amount} to ${this.dailyGains}`);
  }
  
  resetDailyGains(): void {
    this.dailyGains = 0;
    const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
    persistToLocalStorage(storageKey, '0');
    console.log('Daily gains reset to 0');
    
    // Dispatch an event to notify the rest of the application
    try {
      window.dispatchEvent(new CustomEvent('dailyGains:reset', {
        detail: { userId: this.userId, timestamp: new Date().toISOString() }
      }));
    } catch (e) {
      console.error('Failed to dispatch dailyGains:reset event:', e);
    }
  }
  
  setUserId(userId: string | null): void {
    if (this.userId !== userId) {
      this.userId = userId;
      this.loadDailyGains();
    }
  }
}
