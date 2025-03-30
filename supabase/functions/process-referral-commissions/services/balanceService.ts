
import { supabase } from "../utils/supabaseClient.ts";
import { withRetry } from "../utils/retryMechanism.ts";
import { createDetailedError } from "../utils/errorHandler.ts";

/**
 * Récupère le solde actuel d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Le solde actuel ou null en cas d'erreur
 */
export async function getUserBalance(userId: string): Promise<number | null> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .maybeSingle();
        
      if (error || !data) {
        throw createDetailedError(
          `Erreur lors de la récupération du solde pour ${userId}`, 
          { userId, supabaseError: error }
        );
      }
      
      return parseFloat(data.balance);
    }, 3, 1000); // Retry up to 3 times with 1s initial delay
  } catch (error) {
    console.error(`Exception lors de la récupération du solde pour ${userId}:`, error);
    return null;
  }
}

/**
 * Met à jour le solde d'un utilisateur
 * @param userId ID de l'utilisateur
 * @param amount Montant à ajouter au solde
 * @returns true si la mise à jour a réussi, sinon false
 */
export async function updateUserBalance(userId: string, amount: number): Promise<boolean> {
  try {
    return await withRetry(async () => {
      // Récupérer le solde actuel
      const currentBalance = await getUserBalance(userId);
      
      if (currentBalance === null) {
        throw createDetailedError(
          `Impossible de récupérer le solde actuel pour ${userId}`, 
          { userId, amount }
        );
      }
      
      // Calculer le nouveau solde
      const newBalance = currentBalance + amount;
      
      // Mettre à jour le solde
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
        
      if (updateError) {
        throw createDetailedError(
          `Erreur lors de la mise à jour du solde pour ${userId}`, 
          { userId, amount, newBalance, supabaseError: updateError }
        );
      }
      
      console.log(`Solde mis à jour pour ${userId}: ${currentBalance}€ -> ${newBalance}€`);
      return true;
    }, 3, 2000); // Retry up to 3 times with 2s initial delay
  } catch (error) {
    console.error(`Exception lors de la mise à jour du solde pour ${userId}:`, error);
    return false;
  }
}
