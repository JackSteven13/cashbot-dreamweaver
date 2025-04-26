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
  private highestObservedGain: number = 0;  // Nouvelle propriété pour traquer le gain le plus élevé observé
  private lockKey: string = '';  // Clé pour le verrouillage
  private persistenceRetries: number = 0;  // Compteur de tentatives de persistance
  
  constructor(userId: string | null = null) {
    this.userId = userId;
    this.lockKey = this.userId ? `dailyGains_lock_${this.userId}` : 'dailyGains_lock';
    this.loadDailyGains();
    this.checkForDayChange();
    
    // Setup queue processor
    this.setupQueueProcessor();
    
    // Initial consistency check
    this.performConsistencyCheck();
    
    // Schedule periodic consistency checks
    setInterval(() => this.performConsistencyCheck(), 15000); // Every 15 seconds
    
    // Create a stable history of valid values
    this.stableGainsHistory.push(this.dailyGains);
    
    // Snapshot current value for detecting anomalies
    this.dailyGainsSnapshot = this.dailyGains;
    this.highestObservedGain = this.dailyGains;
    
    // Create a stability check interval
    setInterval(() => this.ensureStability(), 30000); // Every 30 seconds
    
    // Recovery check on window focus
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.checkAndRecoverFromBackup();
        this.performConsistencyCheck();
      });
    }
  }
  
  private ensureStability(): void {
    try {
      // Si la valeur actuelle est significativement inférieure au max observé sans raison valide
      if (this.dailyGains < this.highestObservedGain - 0.01) {
        console.warn(`Correcting unexpected decrease in daily gains: ${this.dailyGains} < ${this.highestObservedGain}. Restoring to highest observed value.`);
        // Restaurer à la valeur maximale observée si on détecte une baisse inexpliquée
        this.dailyGains = this.highestObservedGain;
        this.persistGainsToStorage();
        
        // Notifier l'interface utilisateur de la correction
        try {
          window.dispatchEvent(new CustomEvent('dailyGains:corrected', {
            detail: { 
              correctedValue: this.highestObservedGain,
              previousValue: this.dailyGains, 
              reason: 'unexpected_decrease' 
            }
          }));
        } catch (e) {
          console.error('Failed to dispatch correction event:', e);
        }
      } 
      // Si la valeur est valide et supérieure au max observé, mettre à jour le max
      else if (this.dailyGains > this.highestObservedGain) {
        this.highestObservedGain = this.dailyGains;
        // Mettre à jour le snapshot aussi
        this.dailyGainsSnapshot = this.dailyGains;
      }
      
      // Maintenir un historique des valeurs stables pour référence
      if (this.dailyGains >= 0) {
        this.stableGainsHistory.push(this.dailyGains);
        // Limiter la taille de l'historique
        if (this.stableGainsHistory.length > 10) {
          this.stableGainsHistory.shift();
        }
      }
    } catch (e) {
      console.error('Error ensuring stability:', e);
    }
  }
  
  private performConsistencyCheck(): void {
    try {
      // Vérifier que les gains quotidiens ne sont pas négatifs
      if (this.dailyGains < 0) {
        console.warn(`Detected negative daily gains: ${this.dailyGains}. Resetting to last known consistent value.`);
        this.dailyGains = Math.max(0, this.lastKnownConsistentGains, this.highestObservedGain);
        this.persistGainsToStorage();
      }
      
      // Si nous détectons une baisse soudaine de plus de 1% par rapport aux valeurs précédentes
      const averageHistory = this.getAverageFromHistory();
      if (this.stableGainsHistory.length >= 3 && this.dailyGains < averageHistory * 0.99) {
        console.warn(`Detected abnormal drop in daily gains from ${averageHistory} to ${this.dailyGains}. Restoring.`);
        this.dailyGains = Math.max(this.dailyGains, averageHistory, this.highestObservedGain);
        this.persistGainsToStorage();
      }
      
      // Si les gains quotidiens semblent anormalement élevés pour un compte freemium, les plafonner
      const maxExpectedDailyGain = 0.5; // Maximum prévu pour freemium
      if (this.dailyGains > maxExpectedDailyGain * 2) {  // Plus de flexibilité sur le plafond
        console.warn(`Abnormally high daily gains detected: ${this.dailyGains}. Capping at ${maxExpectedDailyGain * 2}.`);
        this.dailyGains = maxExpectedDailyGain * 2;
        this.persistGainsToStorage();
      }
      
      // Synchroniser avec la valeur stockée pour détecter toute désynchronisation
      this.checkAndRecoverFromBackup();
    } catch (e) {
      console.error('Error during consistency check:', e);
    }
  }
  
  private getAverageFromHistory(): number {
    try {
      if (this.stableGainsHistory.length === 0) return 0;
      const sum = this.stableGainsHistory.reduce((acc, val) => acc + val, 0);
      return sum / this.stableGainsHistory.length;
    } catch (e) {
      console.error('Error calculating average from history:', e);
      return 0;
    }
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
    } catch (e) {
      console.error('Error processing update queue:', e);
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
    if (!this.acquireLock()) {
      console.log('Lock acquisition failed, queuing update');
      this.queueUpdate(amount);
      return;
    }
    
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
          
          // Update max observed
          if (this.dailyGains > this.highestObservedGain) {
            this.highestObservedGain = this.dailyGains;
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
    } finally {
      this.releaseLock();
    }
  }
  
  // Nouveaux mécanismes de verrouillage pour éviter les conflits de mise à jour
  private acquireLock(): boolean {
    try {
      const lockTimestamp = localStorage.getItem(this.lockKey);
      const now = Date.now();
      
      // Si aucun verrou ou verrou expiré (> 3 secondes)
      if (!lockTimestamp || (now - parseInt(lockTimestamp, 10)) > 3000) {
        localStorage.setItem(this.lockKey, now.toString());
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Error acquiring lock:', e);
      return true; // En cas d'erreur, on procède quand même pour éviter un blocage
    }
  }
  
  private releaseLock(): void {
    try {
      localStorage.removeItem(this.lockKey);
    } catch (e) {
      console.error('Error releasing lock:', e);
    }
  }
  
  // Amélioration de la persistance avec gestion des erreurs
  private persistGainsToStorage(): void {
    try {
      const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
      
      // Utiliser une persistance atomique pour éviter les données partielles
      // Fix the atomicUpdate call by providing a function instead of a string
      const updateResult = atomicUpdate(storageKey, (currentValue: string) => {
        return this.dailyGains.toString();
      });
      
      // Check the result and retry if needed
      if (!updateResult && this.persistenceRetries < 3) {
        console.warn(`Failed to persist daily gains, retrying (${this.persistenceRetries + 1}/3)`);
        this.persistenceRetries++;
        setTimeout(() => this.persistGainsToStorage(), 200);
        return;
      }
      
      this.persistenceRetries = 0;
      
      // Sauvegarder une copie de secours avec horodatage pour récupération
      const backupKey = this.userId ? `dailyGains_backup_${this.userId}` : 'dailyGains_backup';
      const backupValue = JSON.stringify({
        value: this.dailyGains,
        highestObserved: this.highestObservedGain,
        timestamp: Date.now(),
        history: this.stableGainsHistory.slice(-3) // Conserver les 3 dernières valeurs
      });
      
      localStorage.setItem(backupKey, backupValue);
    } catch (e) {
      console.error('Failed to persist daily gains:', e);
    }
  }
  
  private loadDailyGains(): void {
    try {
      const storageKey = this.userId ? `dailyGains_${this.userId}` : 'dailyGains';
      const storedDailyGains = getFromLocalStorage(storageKey, '0');
      
      // Essayer de charger la valeur principale d'abord
      if (storedDailyGains !== null) {
        const parsedValue = parseFloat(storedDailyGains);
        this.dailyGains = isNaN(parsedValue) ? 0 : parsedValue;
      }
      
      // Tenter de charger depuis la sauvegarde
      this.checkAndRecoverFromBackup();
      
      // Initialiser la dernière valeur cohérente connue
      this.lastKnownConsistentGains = this.dailyGains;
      this.dailyGainsSnapshot = this.dailyGains;
      this.highestObservedGain = this.dailyGains;
      
      // Charger la date de dernière réinitialisation
      const lastResetKey = this.userId ? `lastResetDate_${this.userId}` : 'lastResetDate';
      this.lastResetDate = getFromLocalStorage(lastResetKey, this.getCurrentDateString());
      
      console.log(`Loaded daily gains: ${this.dailyGains.toFixed(2)} for date ${this.lastResetDate}`);
    } catch (e) {
      console.error('Failed to load daily gains:', e);
    }
  }
  
  private checkAndRecoverFromBackup(): void {
    try {
      const backupKey = this.userId ? `dailyGains_backup_${this.userId}` : 'dailyGains_backup';
      const backupValue = localStorage.getItem(backupKey);
      
      if (backupValue) {
        const backup = JSON.parse(backupValue);
        
        // Utiliser la sauvegarde si elle a une structure valide et si la valeur principale est suspecte
        if (backup && typeof backup.value === 'number' && 
            (isNaN(this.dailyGains) || this.dailyGains < 0 || backup.value > this.dailyGains)) {
          console.log(`Restoring daily gains from backup: ${this.dailyGains} -> ${backup.value}`);
          this.dailyGains = backup.value;
          
          // Restaurer aussi la valeur maximale observée
          if (typeof backup.highestObserved === 'number' && backup.highestObserved > this.highestObservedGain) {
            this.highestObservedGain = backup.highestObserved;
          }
          
          // Restaurer l'historique si disponible
          if (Array.isArray(backup.history) && backup.history.length > 0) {
            // Fusionner l'historique existant avec celui de la sauvegarde
            const combinedHistory = [...this.stableGainsHistory];
            for (const val of backup.history) {
              if (!combinedHistory.includes(val)) {
                combinedHistory.push(val);
              }
            }
            
            // Trier l'historique et conserver les 10 valeurs les plus récentes/élevées
            combinedHistory.sort((a, b) => b - a);
            this.stableGainsHistory = combinedHistory.slice(0, 10);
          }
          
          // Synchroniser les autres valeurs de référence
          this.lastKnownConsistentGains = Math.max(this.lastKnownConsistentGains, this.dailyGains);
          this.dailyGainsSnapshot = Math.max(this.dailyGainsSnapshot, this.dailyGains);
        }
      }
    } catch (e) {
      console.error('Failed to recover from backup:', e);
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
      
      // Mettre à jour la date de dernière réinitialisation
      const lastResetKey = this.userId ? `lastResetDate_${this.userId}` : 'lastResetDate';
      persistToLocalStorage(lastResetKey, currentDate);
      this.lastResetDate = currentDate;
    }
  }
  
  getDailyGains(): number {
    // Toujours vérifier le changement de jour lors de l'obtention des gains quotidiens
    this.checkForDayChange();
    
    // Effectuer une vérification rapide de cohérence
    if (this.dailyGains < 0) {
      console.warn(`Negative daily gains detected during get: ${this.dailyGains}. Resetting to 0.`);
      this.dailyGains = 0;
      this.persistGainsToStorage();
    } else if (this.dailyGains < this.highestObservedGain) {
      console.warn(`Daily gains below highest observed: ${this.dailyGains} < ${this.highestObservedGain}. Restoring.`);
      this.dailyGains = this.highestObservedGain;
      this.persistGainsToStorage();
    }
    
    return this.dailyGains;
  }
  
  setDailyGains(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to setDailyGains:', amount);
      return;
    }
    
    // Prévenir les valeurs négatives
    const validAmount = Math.max(0, amount);
    
    // Limitation de débit : empêcher les mises à jour multiples rapides
    if (this.processingUpdate) {
      console.log('Another daily gain update is in progress, queueing...');
      this.queueUpdate(validAmount - this.dailyGains); // Mettre en file d'attente la différence
      return;
    }
    
    // Intervalle minimum entre les mises à jour (200ms)
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      console.log('Daily gains updated too quickly, queueing...');
      this.queueUpdate(validAmount - this.dailyGains); // Mettre en file d'attente la différence
      return;
    }
    
    if (!this.acquireLock()) {
      console.log('Lock acquisition failed in setDailyGains, queueing update');
      this.queueUpdate(validAmount - this.dailyGains);
      return;
    }
    
    this.processingUpdate = true;
    
    try {
      this.checkForDayChange(); // Vérifier le changement de jour avant la mise à jour
      
      // Valider le montant pour s'assurer qu'il n'est pas négatif ou déraisonnablement grand
      const safeAmount = Math.max(0, Math.min(validAmount, 1000)); // Plafond de sécurité à 1000
      
      // Arrondir à 2 décimales pour éviter les problèmes de virgule flottante
      const roundedAmount = Math.round(safeAmount * 100) / 100;
      
      // Suivre la dernière valeur valide
      if (roundedAmount >= 0) {
        this.lastKnownConsistentGains = roundedAmount;
      }
      
      // Ne pas permettre une valeur inférieure au maximum observé
      if (roundedAmount >= this.highestObservedGain) {
        this.dailyGains = roundedAmount;
        this.highestObservedGain = roundedAmount;
      } else {
        console.warn(`Attempted to set daily gains to ${roundedAmount}, which is below the highest observed value ${this.highestObservedGain}. Using highest value.`);
        this.dailyGains = this.highestObservedGain;
      }
      
      // Mettre à jour le snapshot uniquement si la nouvelle valeur est supérieure
      if (roundedAmount > this.dailyGainsSnapshot) {
        this.dailyGainsSnapshot = roundedAmount;
      }
      
      // Sauvegarder dans le stockage
      this.persistGainsToStorage();
      
      console.log(`Daily gains set to ${this.dailyGains}`);
      
      this.lastUpdateTime = now;
    } finally {
      this.processingUpdate = false;
      this.releaseLock();
    }
  }
  
  addDailyGain(amount: number): void {
    if (isNaN(amount)) {
      console.error('Invalid amount provided to addDailyGain:', amount);
      return;
    }
    
    // Rejeter les valeurs négatives - les gains quotidiens ne devraient qu'augmenter
    if (amount <= 0) {
      console.warn(`Attempted to add non-positive gain: ${amount}. Ignoring.`);
      return;
    }
    
    // Limitation de débit : empêcher les mises à jour multiples rapides
    if (this.processingUpdate) {
      console.log('Another daily gain update is in progress, queueing...');
      this.queueUpdate(amount);
      return;
    }
    
    // Intervalle minimum entre les mises à jour
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      console.log('Daily gains updated too quickly, queueing...');
      this.queueUpdate(amount);
      return;
    }
    
    if (!this.acquireLock()) {
      console.log('Lock acquisition failed in addDailyGain, queueing update');
      this.queueUpdate(amount);
      return;
    }
    
    this.processingUpdate = true;
    
    try {
      this.checkForDayChange(); // Vérifier le changement de jour avant l'ajout
      
      // Valider le montant pour s'assurer qu'il est raisonnable
      if (amount <= 0 || amount > 1.0) { // Limiter les ajouts individuels à 1.0
        console.log(`Suspicious gain amount: ${amount}, applying restrictions`);
        amount = Math.min(Math.max(0.001, amount), 0.05);
      }
      
      // Arrondir à 4 décimales pour éviter les erreurs de virgule flottante
      const previousGains = this.dailyGains;
      this.dailyGains += amount;
      this.dailyGains = Math.round(this.dailyGains * 10000) / 10000;
      
      // Mettre à jour le stockage
      this.persistGainsToStorage();
      
      console.log(`Daily gains increased by ${amount.toFixed(4)} to ${this.dailyGains.toFixed(4)} (from ${previousGains.toFixed(4)})`);
      
      // Mettre à jour la dernière valeur cohérente et l'historique
      this.lastKnownConsistentGains = this.dailyGains;
      this.stableGainsHistory.push(this.dailyGains);
      if (this.stableGainsHistory.length > 10) {
        this.stableGainsHistory.shift();
      }
      
      // Mettre à jour les valeurs maximales
      if (this.dailyGains > this.highestObservedGain) {
        this.highestObservedGain = this.dailyGains;
      }
      
      // Mettre à jour le snapshot pour la surveillance de stabilité
      this.dailyGainsSnapshot = Math.max(this.dailyGainsSnapshot, this.dailyGains);
      
      this.lastUpdateTime = now;
    } finally {
      this.processingUpdate = false;
      this.releaseLock();
    }
  }
  
  // Ajouter à la file d'attente des mises à jour pour un traitement par lots
  private queueUpdate(amount: number): void {
    this.updateQueue.push({ 
      amount,
      timestamp: Date.now()
    });
  }
  
  resetDailyGains(): void {
    if (!this.acquireLock()) {
      console.log('Lock acquisition failed in resetDailyGains, retrying in 100ms');
      setTimeout(() => this.resetDailyGains(), 100);
      return;
    }
    
    try {
      this.dailyGains = 0;
      this.lastKnownConsistentGains = 0;
      this.dailyGainsSnapshot = 0;
      this.highestObservedGain = 0;
      this.stableGainsHistory = [0];
      
      // Mettre à jour le stockage
      this.persistGainsToStorage();
      
      console.log('Daily gains reset to 0');
      
      // Vider la file d'attente des mises à jour lors de la réinitialisation
      this.updateQueue = [];
      
      // Déclencher un événement pour notifier le reste de l'application
      try {
        window.dispatchEvent(new CustomEvent('dailyGains:reset', {
          detail: { userId: this.userId, timestamp: new Date().toISOString() }
        }));
      } catch (e) {
        console.error('Failed to dispatch dailyGains:reset event:', e);
      }
    } finally {
      this.releaseLock();
    }
  }
  
  setUserId(userId: string | null): void {
    if (this.userId !== userId) {
      this.userId = userId;
      this.lockKey = this.userId ? `dailyGains_lock_${this.userId}` : 'dailyGains_lock';
      this.loadDailyGains();
      this.checkForDayChange();
      
      // Réinitialiser l'historique et le snapshot lors du changement d'utilisateurs
      this.stableGainsHistory = [this.dailyGains];
      this.dailyGainsSnapshot = this.dailyGains;
      this.highestObservedGain = this.dailyGains;
    }
  }
}
