
/**
 * BalanceManager - Gestionnaire centralisé pour le solde utilisateur
 * 
 * Ce module gère l'état du solde de l'utilisateur et fournit des méthodes
 * pour synchroniser et mettre à jour le solde de manière cohérente à travers l'application.
 */

import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { supabase } from '@/integrations/supabase/client';

// Clés de stockage local
const STORAGE_KEYS = {
  CURRENT_BALANCE: 'current_balance',
  DAILY_GAINS: 'stats_daily_gains',
  LAST_SYNC_DATE: 'stats_last_sync_date',
  HIGHEST_BALANCE: 'highest_balance'
};

// Type pour les observateurs de changement de solde
type BalanceWatcher = (newBalance: number, oldBalance: number) => void;

class BalanceManager {
  private currentBalance: number;
  private dailyGains: number;
  private watchers: BalanceWatcher[];
  private isInitialized: boolean;

  constructor() {
    this.currentBalance = 0;
    this.dailyGains = 0;
    this.watchers = [];
    this.isInitialized = false;
    this.loadFromStorage();
  }

  /**
   * Charge les valeurs depuis le stockage local
   */
  private loadFromStorage(): void {
    try {
      const storedBalance = localStorage.getItem(STORAGE_KEYS.CURRENT_BALANCE);
      const storedDailyGains = localStorage.getItem(STORAGE_KEYS.DAILY_GAINS);
      
      this.currentBalance = storedBalance ? parseFloat(storedBalance) : 0;
      this.dailyGains = storedDailyGains ? parseFloat(storedDailyGains) : 0;
      
      // Vérifier s'il faut réinitialiser les gains quotidiens
      this.checkDailyReset();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading balance from storage:', error);
      this.currentBalance = 0;
      this.dailyGains = 0;
    }
  }

  /**
   * Vérifie s'il faut réinitialiser les gains quotidiens
   */
  private checkDailyReset(): void {
    const today = new Date().toDateString();
    const lastSyncDate = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_DATE);
    
    if (lastSyncDate !== today) {
      // C'est un nouveau jour, réinitialiser les gains quotidiens
      this.dailyGains = 0;
      localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, '0');
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_DATE, today);
      
      // Notifier l'application de la réinitialisation
      window.dispatchEvent(new CustomEvent('dailyGains:reset'));
    }
  }

  /**
   * Sauvegarde les valeurs dans le stockage local
   */
  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_BALANCE, this.currentBalance.toString());
    localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, this.dailyGains.toString());
    
    // Mettre à jour également la valeur maximale du solde si nécessaire
    const highestBalance = this.getHighestBalance();
    if (this.currentBalance > highestBalance) {
      localStorage.setItem(STORAGE_KEYS.HIGHEST_BALANCE, this.currentBalance.toString());
    }
  }

  /**
   * Notifie les observateurs des changements de solde
   */
  private notifyWatchers(oldBalance: number): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(this.currentBalance, oldBalance);
      } catch (error) {
        console.error('Error in balance watcher:', error);
      }
    });
  }

  /**
   * Initialise le gestionnaire avec un solde initial
   */
  public initialize(initialBalance: number): number {
    const oldBalance = this.currentBalance;
    this.currentBalance = initialBalance;
    this.saveToStorage();
    
    if (this.isInitialized) {
      this.notifyWatchers(oldBalance);
    }
    
    this.isInitialized = true;
    return this.currentBalance;
  }

  /**
   * Met à jour le solde
   */
  public updateBalance(newAmount: number): number {
    if (typeof newAmount !== 'number' || isNaN(newAmount)) {
      console.error('Invalid balance amount:', newAmount);
      return this.currentBalance;
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance = Math.max(0, this.currentBalance + newAmount);
    this.saveToStorage();
    
    this.notifyWatchers(oldBalance);
    
    // Propager l'événement de mise à jour du solde
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: {
        oldBalance,
        currentBalance: this.currentBalance,
        animate: true
      }
    }));
    
    return this.currentBalance;
  }

  /**
   * Force la synchronisation du solde avec une valeur donnée
   */
  public forceBalanceSync(amount: number): number {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error('Invalid balance amount for sync:', amount);
      return this.currentBalance;
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance = Math.max(0, amount);
    this.saveToStorage();
    
    this.notifyWatchers(oldBalance);
    return this.currentBalance;
  }

  /**
   * Synchronise le solde avec le serveur
   */
  public async syncWithServer(serverBalance: number): Promise<number> {
    const highestBalance = this.getHighestBalance();
    
    // Si le solde du serveur est plus élevé, utiliser celui-ci
    if (serverBalance > highestBalance) {
      this.forceBalanceSync(serverBalance);
      return this.currentBalance;
    }
    
    // Si notre solde local est plus élevé, essayer de mettre à jour le serveur
    if (highestBalance > serverBalance) {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          const { error } = await supabase
            .from('user_balances')
            .update({ 
              balance: highestBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (error) {
            console.error('Error updating server balance:', error);
          } else {
            console.log(`Updated server balance to match local: ${highestBalance}`);
          }
        }
      } catch (e) {
        console.error('Error during balance server sync:', e);
      }
    }
    
    return this.currentBalance;
  }

  /**
   * Ajoute un montant au solde actuel
   */
  public addToBalance(amount: number): boolean {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      console.error('Invalid amount to add:', amount);
      return false;
    }
    
    const oldBalance = this.currentBalance;
    this.currentBalance += amount;
    this.saveToStorage();
    
    this.notifyWatchers(oldBalance);
    
    // Propager l'événement d'ajout au solde
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: {
        amount,
        oldBalance,
        currentBalance: this.currentBalance,
        animate: true
      }
    }));
    
    return true;
  }

  /**
   * Ajoute un gain aux gains journaliers avec vérification des limites
   */
  public addDailyGain(amount: number, subscription: string = 'freemium'): boolean {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      console.error('Invalid daily gain amount:', amount);
      return false;
    }
    
    // Vérifier si c'est un nouveau jour
    this.checkDailyReset();
    
    // Récupérer la limite quotidienne en fonction de l'abonnement
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Vérifier si l'ajout dépasserait la limite
    if (this.dailyGains + amount > dailyLimit) {
      // Si la limite serait dépassée mais qu'il reste un peu de marge,
      // ajuster le montant pour atteindre exactement la limite
      if (this.dailyGains < dailyLimit) {
        const adjustedAmount = dailyLimit - this.dailyGains;
        this.dailyGains = dailyLimit;
        localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, this.dailyGains.toString());
        
        // Ajouter le montant ajusté au solde
        this.addToBalance(adjustedAmount);
        
        // Notifier que la limite a été atteinte
        window.dispatchEvent(new CustomEvent('dailyLimit:reached', {
          detail: { 
            limit: dailyLimit,
            subscription
          }
        }));
        
        return true;
      }
      
      // La limite est déjà atteinte
      return false;
    }
    
    // Ajouter le gain au total journalier
    this.dailyGains += amount;
    localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, this.dailyGains.toString());
    
    // Ajouter également au solde global
    this.addToBalance(amount);
    
    // Propager l'événement de mise à jour des gains journaliers
    window.dispatchEvent(new CustomEvent('dailyGains:updated', {
      detail: {
        gains: this.dailyGains,
        limit: dailyLimit,
        percentage: (this.dailyGains / dailyLimit) * 100
      }
    }));
    
    return true;
  }

  /**
   * Réinitialise le solde à 0
   */
  public resetBalance(): number {
    const oldBalance = this.currentBalance;
    this.currentBalance = 0;
    this.saveToStorage();
    
    this.notifyWatchers(oldBalance);
    
    // Propager l'événement de réinitialisation du solde
    window.dispatchEvent(new CustomEvent('balance:reset-complete'));
    
    return this.currentBalance;
  }

  /**
   * Réinitialise les gains quotidiens à 0
   */
  public resetDailyGains(): number {
    this.dailyGains = 0;
    localStorage.setItem(STORAGE_KEYS.DAILY_GAINS, '0');
    return this.dailyGains;
  }

  /**
   * Obtient le solde actuel
   */
  public getCurrentBalance(): number {
    return this.currentBalance;
  }

  /**
   * Obtient le solde stable (pour l'affichage)
   */
  public getStableBalance(): number {
    return this.currentBalance;
  }

  /**
   * Obtient le solde le plus élevé jamais atteint
   */
  public getHighestBalance(): number {
    try {
      const storedHighest = localStorage.getItem(STORAGE_KEYS.HIGHEST_BALANCE);
      const highestBalance = storedHighest ? parseFloat(storedHighest) : 0;
      return Math.max(highestBalance, this.currentBalance);
    } catch (e) {
      return this.currentBalance;
    }
  }

  /**
   * Obtient les gains journaliers actuels
   */
  public getDailyGains(): number {
    this.checkDailyReset();
    return this.dailyGains;
  }

  /**
   * Obtient le pourcentage de la limite quotidienne atteinte
   */
  public getDailyLimitPercentage(subscription: string = 'freemium'): number {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    return Math.min(100, (this.dailyGains / dailyLimit) * 100);
  }

  /**
   * Ajoute un observateur de changement de solde
   */
  public addWatcher(watcher: BalanceWatcher): () => void {
    this.watchers.push(watcher);
    
    // Retourner une fonction de nettoyage
    return () => {
      this.watchers = this.watchers.filter(w => w !== watcher);
    };
  }

  /**
   * Nettoyer les données utilisateur lors d'un changement d'utilisateur
   */
  public cleanupUserBalanceData(): void {
    this.currentBalance = 0;
    this.dailyGains = 0;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_BALANCE);
    localStorage.removeItem(STORAGE_KEYS.DAILY_GAINS);
    localStorage.removeItem(STORAGE_KEYS.HIGHEST_BALANCE);
  }
  
  /**
   * Synchroniser avec la base de données
   */
  public async syncWithDatabase(): Promise<boolean> {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return false;
      
      // Récupérer le solde du serveur
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching balance from database:', error);
        return false;
      }
      
      // Comparer avec notre solde local
      const serverBalance = data?.balance || 0;
      await this.syncWithServer(serverBalance);
      return true;
    } catch (e) {
      console.error('Error during database sync:', e);
      return false;
    }
  }
}

// Exportation d'une instance singleton
const balanceManager = new BalanceManager();
export default balanceManager;
