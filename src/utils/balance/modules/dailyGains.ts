import { persistToLocalStorage, getFromLocalStorage, atomicUpdate } from '../storage/localStorageUtils';

export class DailyGainsManager {
  private dailyGains: number = 0;
  private userId: string | null = null;
  private lastResetDate: string = '';
  private lastUpdateTime: number = 0;
  private processingUpdate: boolean = false;
  private updateQueue: {amount: number, timestamp: number}[] = [];
  private isProcessingQueue: boolean = false;
  private lastKnownConsistentGains: number = 0;
  private readonly updateInterval: number = 200; // 200ms between updates
  private dailyGainsSnapshot: number = 0;
  private stableGainsHistory: number[] = [];
  private lastPersistTime: number = 0;
  
  constructor(userId: string | null = null) {
    this.userId = userId;
    this.loadDailyGains();
    this.checkForDayChange();
    
    // Setup queue processor
    this.setupQueueProcessor();
    
    // Initial consistency check
    this.performConsistencyCheck();
    
    // Schedule periodic consistency checks
    setInterval(() => this.performConsistencyCheck(), 30000); // Every 30 seconds
    
    // Create a stable history of valid values
    this.stableGainsHistory.push(this.dailyGains);
    
    // Snapshot current value for detecting anomalies
    this.dailyGainsSnapshot = this.dailyGains;
    
    // Create a stability check interval
    setInterval(() => this.ensureStability(), 60000); // Every minute
  }
  
  private ensureStability(): void {
    // If current value is significantly different from historical values without reason
    if (this.dailyGains < this.dailyGainsSnapshot - 0.1) {
      console.warn(`Detected unexpected decrease in daily gains: ${this.dailyGains} < ${this.dailyGainsSnapshot}. Restoring.`);
      // Restore to the last snapshot if we detect an unexpected decrease
      this.dailyGains = this.dailyGainsSnapshot;
      this.persistGainsToStorage();
    } else {
      // Only update snapshot when values look valid (stable or increasing)
      this.dailyGainsSnapshot = Math.max(this.dailyGainsSnapshot, this.dailyGains);
    }
    
    // Update stable history to track consistent values
    if (this.dailyGains >= 0) {
      this.stableGainsHistory.push(this.dailyGains);
      // Keep history at a reasonable size
      if (this.stableGainsHistory.length > 10) {
        this.stableGainsHistory.shift();
      }
    }
  }
  
  private performConsistencyCheck(): void {
    // Verify that daily gains haven't gone negative
    if (this.dailyGains < 0) {
      console.warn(`Detected negative daily gains: ${this.dailyGains}. Resetting to last known consistent value.`);
      this.dailyGains = Math.max(0, this.lastKnownConsistentGains);
      this.persistGainsToStorage();
    }
    
    // If we have a sudden drop of more than 10% from previous values
    const averageHistory = this.getAverageFromHistory();
    if (this.stableGainsHistory.length >= 3 && this.dailyGains < averageHistory * 0.9) {
      console.warn(`Detected abnormal drop in daily gains from ${averageHistory} to ${this.dailyGains}. Restoring.`);
      this.dailyGains = Math.max(this.dailyGains, averageHistory);
      this.persistGainsToStorage();
    }
    
    // If daily gains seem abnormally high for a freemium account, cap it
    const maxExpectedDailyGain = 0.5; // Maximum expected for freemium
    if (this.dailyGains > maxExpectedDailyGain * 1.5) {
      console.warn(`Abnormally high daily gains detected: ${this.dailyGains}. Capping at ${maxExpectedDailyGain}.`);
      this.dailyGains = maxExpectedDailyGain;
      this.persistGainsToStorage();
    }
  }
  
  private getAverageFromHistory(): number {
    if (this.stableGainsHistory.length === 0) return 0;
    const sum = this.stableGainsHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.stableGainsHistory.length;
  }
  
  private setupQueueProcessor() {
    // Process queued updates every 200ms
    setInterval(() => {
      this.processUpdateQueue();
    }, this.updateInterval);
  }
  
  private async processUpdateQueue() {
    if (this.isProcessingQueue || this.updateQueue.length === 0) {
      return;
    }
    
    try {
      this.isProcessingQueue = true;
      
      // Sort updates by timestamp to process them in order
      this.updateQueue.sort((a, b) => a.timestamp - b.timestamp);
      
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
      
      // Get current value before updating
      const beforeUpdate = this.dailyGains;
      
      // Apply the update
      this.dailyGains += amount;
      
      // Round to 2 decimal places to avoid floating point issues
      this.dailyGains = Math.round(this.dailyGains * 100) / 100;
      
      // Ensure we never go negative
      if (this.dailyGains < 0) {
        console.warn(`Prevented negative daily gains: ${this.dailyGains}. Using 0 instead.`);
        this.dailyGains = 0;
      }
      
      // If update looks valid, update last known consistent value
      if (this.dailyGains >= beforeUpdate || amount < 0) {
        this.lastKnownConsistentGains = this.dailyGains;
        
        // Add to history when we have a valid increase
        if (this.dailyGains > beforeUpdate) {
          this.stableGainsHistory.push(this.dailyGains);
          if (this.stableGainsHistory.length > 10) {
            this.stableGainsHistory.shift();
          }
          this.dailyGainsSnapshot = Math.max(this.dailyGainsSnapshot, this.dailyGains);
        }
      }
      
      // Save to storage, but not too frequently
      const now = Date.now();
      if (now - this.lastPersistTime > 500) { // At most every 500ms to avoid excessive writes
        this.persistGainsToStorage();
        this.lastPersistTime = now;
      }
      
      this.lastUpdateTime = Date.now();
    } catch (e) {
      console.error('Error processing daily gains update:', e);
    }
  }
  
  private persistGainsToStorage(): void {
    const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
    persistToLocalStorage(storageKey, this.dailyGains.toString());
    
    // Also persist a backup copy with timestamp for recovery
    try {
      const backupKey = this.userId ? `dailyGains_backup_${this.userId}` : 'dailyGains_backup';
      const backupValue = JSON.stringify({
        value: this.dailyGains,
        timestamp: Date.now(),
        history: this.stableGainsHistory.slice(-3) // Keep last 3 values in backup
      });
      localStorage.setItem(backupKey, backupValue);
    } catch (e) {
      console.error('Failed to persist backup daily gains:', e);
    }
  }
  
  private loadDailyGains(): void {
    try {
      const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
      const storedDailyGains = getFromLocalStorage(storageKey, '0');
      
      // Try to load main value first
      if (storedDailyGains !== null) {
        this.dailyGains = parseFloat(storedDailyGains);
      }
      
      // Try to load from backup if available
      try {
        const backupKey = this.userId ? `dailyGains_backup_${this.userId}` : 'dailyGains_backup';
        const backupValue = localStorage.getItem(backupKey);
        
        if (backupValue) {
          const backup = JSON.parse(backupValue);
          
          // Only use backup if it has a valid structure and main value is suspicious
          if (backup && typeof backup.value === 'number' && 
              (isNaN(this.dailyGains) || this.dailyGains < 0 || backup.value > this.dailyGains)) {
            console.log(`Restoring daily gains from backup: ${this.dailyGains} -> ${backup.value}`);
            this.dailyGains = backup.value;
            
            // Restore history if available
            if (Array.isArray(backup.history)) {
              this.stableGainsHistory = [...backup.history];
            }
          }
        }
      } catch (e) {
        console.error('Failed to load backup daily gains:', e);
      }
      
      // Initialize the last known consistent value
      this.lastKnownConsistentGains = this.dailyGains;
      this.dailyGainsSnapshot = this.dailyGains;
      
      // Also load the last reset date
      const lastResetKey = this.userId ? `lastResetDate_${this.userId}` : 'lastResetDate';
      this.lastResetDate = getFromLocalStorage(lastResetKey, this.getCurrentDateString());
      
      console.log(`Loaded daily gains: ${this.dailyGains.toFixed(2)} for date ${this.lastResetDate}`);
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
    
    // Perform a quick consistency check
    if (this.dailyGains < 0) {
      console.warn(`Negative daily gains detected during get: ${this.dailyGains}. Resetting to 0.`);
      this.dailyGains = 0;
      this.persistGainsToStorage();
    }
    
    return this.dailyGains;
  }
  
  setDailyGains(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to setDailyGains:', amount);
      return;
    }
    
    // Prevent negative values
    const validAmount = Math.max(0, amount);
    
    // Rate limiting: prevent multiple rapid updates
    if (this.processingUpdate) {
      console.log('Another daily gain update is in progress, queueing...');
      this.queueUpdate(validAmount - this.dailyGains); // Queue the difference
      return;
    }
    
    // Minimum interval between updates (200ms)
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      console.log('Daily gains updated too quickly, queueing...');
      this.queueUpdate(validAmount - this.dailyGains); // Queue the difference
      return;
    }
    
    this.processingUpdate = true;
    
    try {
      this.checkForDayChange(); // Check for day change before setting
      
      // Validate the amount to ensure it's not negative or unreasonably large
      const safeAmount = Math.max(0, Math.min(validAmount, 1000)); // Sanity cap at 1000
      
      // Round to 2 decimal places to avoid floating point issues
      const roundedAmount = Math.round(safeAmount * 100) / 100;
      
      // Track the last valid value
      if (roundedAmount >= 0) {
        this.lastKnownConsistentGains = roundedAmount;
      }
      
      this.dailyGains = roundedAmount;
      
      // Update snapshot only if the new value is greater (to prevent unexpected drops)
      if (roundedAmount > this.dailyGainsSnapshot) {
        this.dailyGainsSnapshot = roundedAmount;
      }
      
      // Save to storage
      this.persistGainsToStorage();
      
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
    
    // Reject negative values - daily gains should only increase
    if (amount <= 0) {
      console.warn(`Attempted to add non-positive gain: ${amount}. Ignoring.`);
      return;
    }
    
    // Rate limiting: prevent multiple rapid updates
    if (this.processingUpdate) {
      console.log('Another daily gain update is in progress, queueing...');
      this.queueUpdate(amount);
      return;
    }
    
    // Minimum interval between updates
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
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
      
      // Round to 4 decimal places to avoid floating point errors
      const previousGains = this.dailyGains;
      this.dailyGains += amount;
      this.dailyGains = Math.round(this.dailyGains * 10000) / 10000;
      
      // Update storage
      this.persistGainsToStorage();
      
      console.log(`Daily gains increased by ${amount.toFixed(4)} to ${this.dailyGains.toFixed(4)} (from ${previousGains.toFixed(4)})`);
      
      // Update last consistent value and history
      this.lastKnownConsistentGains = this.dailyGains;
      this.stableGainsHistory.push(this.dailyGains);
      if (this.stableGainsHistory.length > 10) {
        this.stableGainsHistory.shift();
      }
      
      // Update snapshot for stability monitoring
      this.dailyGainsSnapshot = Math.max(this.dailyGainsSnapshot, this.dailyGains);
      
      this.lastUpdateTime = now;
    } finally {
      this.processingUpdate = false;
    }
  }
  
  // Add to update queue for batched processing
  private queueUpdate(amount: number): void {
    this.updateQueue.push({ 
      amount,
      timestamp: Date.now()
    });
  }
  
  resetDailyGains(): void {
    this.dailyGains = 0;
    this.lastKnownConsistentGains = 0;
    this.dailyGainsSnapshot = 0;
    this.stableGainsHistory = [0];
    
    // Update storage
    this.persistGainsToStorage();
    
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
      
      // Reset history and snapshot when changing users
      this.stableGainsHistory = [this.dailyGains];
      this.dailyGainsSnapshot = this.dailyGains;
    }
  }
}
