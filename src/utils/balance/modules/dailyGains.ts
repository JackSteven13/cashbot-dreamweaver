
import { persistToLocalStorage, getFromLocalStorage, atomicUpdate } from "../storage/localStorageUtils";

export class DailyGainsManager {
  private userId: string | null = null;
  private dailyGains: number = 0;
  
  constructor(userId?: string | null) {
    this.userId = userId || null;
    this.loadFromStorage();
  }
  
  setUserId(userId: string | null): void {
    this.userId = userId;
    this.loadFromStorage();
  }
  
  private loadFromStorage(): void {
    const storedGains = getFromLocalStorage<number>('dailyGains', this.userId, 0);
    this.dailyGains = storedGains || 0;
  }
  
  getDailyGains(): number {
    return this.dailyGains;
  }
  
  setDailyGains(amount: number): void {
    this.dailyGains = amount;
    persistToLocalStorage('dailyGains', amount, this.userId);
  }
  
  addDailyGain(amount: number): void {
    this.dailyGains += amount;
    persistToLocalStorage('dailyGains', this.dailyGains, this.userId);
  }
  
  resetDailyGains(): void {
    this.dailyGains = 0;
    persistToLocalStorage('dailyGains', 0, this.userId);
  }
}

export default DailyGainsManager;
