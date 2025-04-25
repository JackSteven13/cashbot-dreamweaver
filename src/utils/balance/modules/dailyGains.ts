
import { persistToLocalStorage } from '../storage/localStorageUtils';

export class DailyGainsManager {
  private dailyGains: number = 0;
  private userId: string | null = null;
  
  constructor(userId: string | null = null) {
    this.userId = userId;
    this.loadDailyGains();
  }
  
  private loadDailyGains(): void {
    try {
      const storedDailyGains = localStorage.getItem(this.userId ? `dailyGains_${this.userId}` : 'dailyGains');
      if (storedDailyGains !== null) {
        this.dailyGains = parseFloat(storedDailyGains);
      }
    } catch (e) {
      console.error('Failed to load daily gains:', e);
    }
  }
  
  getDailyGains(): number {
    return this.dailyGains;
  }
  
  setDailyGains(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to setDailyGains:', amount);
      return;
    }
    
    this.dailyGains = amount;
    persistToLocalStorage(this.userId ? `dailyGains_${this.userId}` : 'dailyGains', amount.toString());
    console.log(`Daily gains set to ${amount}`);
  }
  
  addDailyGain(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to addDailyGain:', amount);
      return;
    }
    
    this.dailyGains += amount;
    persistToLocalStorage(this.userId ? `dailyGains_${this.userId}` : 'dailyGains', this.dailyGains.toString());
    console.log(`Daily gains increased by ${amount} to ${this.dailyGains}`);
  }
  
  resetDailyGains(): void {
    this.dailyGains = 0;
    persistToLocalStorage(this.userId ? `dailyGains_${this.userId}` : 'dailyGains', '0');
    console.log('Daily gains reset to 0');
  }
  
  setUserId(userId: string | null): void {
    this.userId = userId;
    this.loadDailyGains();
  }
}
