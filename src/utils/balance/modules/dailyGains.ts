
import { persistToLocalStorage, getFromLocalStorage, atomicUpdate } from '../storage/localStorageUtils';

export class DailyGainsManager {
  private dailyGains: number = 0;
  private userId: string | null = null;
  private lastResetDate: string = '';
  private lastUpdateTime: number = 0;
  private processingUpdate: boolean = false;
  private updateQueue: {amount: number}[] = [];
  private isProcessingQueue: boolean = false;
  
  constructor(userId: string | null = null) {
    this.userId = userId;
    this.loadDailyGains();
    this.checkForDayChange();
    
    // Setup queue processor
    this.setupQueueProcessor();
  }
  
  private setupQueueProcessor() {
    // Process queued updates every 200ms
    setInterval(() => {
      this.processUpdateQueue();
    }, 200);
  }
  
  private async processUpdateQueue() {
    if (this.isProcessingQueue || this.updateQueue.length === 0) {
      return;
    }
    
    try {
      this.isProcessingQueue = true;
      
      // Take the first update from the queue
      const update = this.updateQueue.shift();
      if (update) {
        // Process the update directly
        await this.processUpdate(update.amount);
      }
    } finally {
      this.isProcessingQueue = false;
      
      // If there are more updates in the queue, process them on next interval
      if (this.updateQueue.length > 0) {
        // Add short delay between processing items
        setTimeout(() => {
          this.processUpdateQueue();
        }, 50);
      }
    }
  }
  
  private async processUpdate(amount: number) {
    try {
      this.checkForDayChange(); // Check for day change
      
      // Apply the update
      this.dailyGains += amount;
      
      // Round to 2 decimal places to avoid floating point issues
      this.dailyGains = Math.round(this.dailyGains * 100) / 100;
      
      const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
      persistToLocalStorage(storageKey, this.dailyGains.toString());
      
      this.lastUpdateTime = Date.now();
    } catch (e) {
      console.error('Error processing daily gains update:', e);
    }
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
    
    // Rate limiting: prevent multiple rapid updates
    if (this.processingUpdate) {
      console.log('Another daily gain update is in progress, queueing...');
      this.queueUpdate(amount - this.dailyGains); // Queue the difference
      return;
    }
    
    // Minimum interval between updates (200ms)
    const now = Date.now();
    if (now - this.lastUpdateTime < 200) {
      console.log('Daily gains updated too quickly, queueing...');
      this.queueUpdate(amount - this.dailyGains); // Queue the difference
      return;
    }
    
    this.processingUpdate = true;
    
    try {
      this.checkForDayChange(); // Check for day change before setting
      
      // Validate the amount to ensure it's not negative or unreasonably large
      const validAmount = Math.max(0, Math.min(amount, 1000)); // Sanity cap at 1000
      
      // Round to 2 decimal places to avoid floating point issues
      const roundedAmount = Math.round(validAmount * 100) / 100;
      
      this.dailyGains = roundedAmount;
      const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
      persistToLocalStorage(storageKey, roundedAmount.toString());
      console.log(`Daily gains set to ${roundedAmount}`);
      
      this.lastUpdateTime = now;
    } finally {
      this.processingUpdate = false;
    }
  }
  
  addDailyGain(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to addDailyGain:', amount);
      return;
    }
    
    // Rate limiting: prevent multiple rapid updates
    if (this.processingUpdate) {
      console.log('Another daily gain update is in progress, queueing...');
      this.queueUpdate(amount);
      return;
    }
    
    // Minimum interval between updates (200ms)
    const now = Date.now();
    if (now - this.lastUpdateTime < 200) {
      console.log('Daily gains updated too quickly, queueing...');
      this.queueUpdate(amount);
      return;
    }
    
    this.processingUpdate = true;
    
    try {
      this.checkForDayChange(); // Check for day change before adding
      
      // Validate the amount to ensure it's reasonable
      if (amount <= 0 || amount > 1.0) { // Cap single additions at 1.0
        console.log(`Suspicious gain amount: ${amount}, applying restrictions`);
        amount = Math.min(Math.max(0.001, amount), 0.05);
      }
      
      // Round to 4 decimal places to avoid floating point issues
      const previousGains = this.dailyGains;
      this.dailyGains += amount;
      this.dailyGains = Math.round(this.dailyGains * 10000) / 10000;
      
      const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
      persistToLocalStorage(storageKey, this.dailyGains.toString());
      console.log(`Daily gains increased by ${amount} to ${this.dailyGains} (from ${previousGains})`);
      
      this.lastUpdateTime = now;
    } finally {
      this.processingUpdate = false;
    }
  }
  
  // Add to update queue for batched processing
  private queueUpdate(amount: number): void {
    this.updateQueue.push({ amount });
  }
  
  resetDailyGains(): void {
    this.dailyGains = 0;
    const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
    persistToLocalStorage(storageKey, '0');
    console.log('Daily gains reset to 0');
    
    // Clear the update queue on reset
    this.updateQueue = [];
    
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
      this.checkForDayChange();
    }
  }
}
