
/**
 * BalanceManager - Gestionnaire central des opérations de solde utilisateur
 * Fournit des méthodes pour toutes les opérations liées au solde utilisateur
 */

import { supabase } from '@/integrations/supabase/client';

export class BalanceManager {
  private userId: string;
  private currentBalance: number = 0;
  private highestBalance: number = 0;
  private subscription: string = 'freemium';

  constructor(userId: string, initialBalance: number = 0, subscription: string = 'freemium') {
    this.userId = userId;
    this.currentBalance = initialBalance;
    this.subscription = subscription;
    this.highestBalance = initialBalance;
  }

  /**
   * Récupère le solde actuel de l'utilisateur depuis la base de données
   */
  async getCurrentBalance(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', this.userId)
        .single();

      if (error) throw error;
      
      this.currentBalance = data?.balance || 0;
      return this.currentBalance;
    } catch (error) {
      console.error('Error getting current balance:', error);
      return this.currentBalance; // Return cached value in case of error
    }
  }

  /**
   * Met à jour le solde de l'utilisateur dans la base de données
   */
  async updateBalance(amount: number, report: string): Promise<boolean> {
    try {
      const newBalance = this.currentBalance + amount;
      
      // Ensure balance doesn't go below zero
      const finalBalance = Math.max(0, newBalance);
      
      const { error } = await supabase
        .from('user_balances')
        .update({ 
          balance: finalBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.userId);

      if (error) throw error;
      
      // Update local cache
      this.currentBalance = finalBalance;
      
      // Update highest balance if needed
      if (finalBalance > this.highestBalance) {
        this.highestBalance = finalBalance;
      }
      
      // If successful, also record the transaction
      await this.recordTransaction(amount, report);
      
      return true;
    } catch (error) {
      console.error('Error updating balance:', error);
      return false;
    }
  }
  
  /**
   * Enregistre une transaction dans l'historique
   */
  private async recordTransaction(amount: number, report: string): Promise<void> {
    try {
      await supabase
        .from('transactions')
        .insert({
          user_id: this.userId,
          amount,
          report,
          date: new Date().toISOString(),
          subscription: this.subscription
        });
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }
  
  /**
   * Réinitialise les compteurs quotidiens sans affecter le solde
   */
  async resetDailyCounters(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_balances')
        .update({ 
          daily_session_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resetting daily counters:', error);
      return false;
    }
  }
  
  /**
   * Obtient la valeur la plus élevée atteinte par le solde
   */
  getHighestBalance(): number {
    return this.highestBalance;
  }
  
  /**
   * Nettoie les données utilisateur lors du changement d'utilisateur
   */
  static cleanupUserBalanceData(): void {
    // Reset any cached balance data in localStorage if needed
    localStorage.removeItem('lastBalanceUpdate');
    localStorage.removeItem('lastSessionTime');
  }
}
