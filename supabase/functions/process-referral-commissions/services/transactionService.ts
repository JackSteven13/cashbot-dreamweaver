
import { supabase } from "../utils/supabaseClient.ts";
import { withRetry } from "../utils/retryMechanism.ts";
import { createDetailedError } from "../utils/errorHandler.ts";

/**
 * Ajoute une transaction pour une commission de parrainage
 * @param userId ID de l'utilisateur (parrain)
 * @param amount Montant de la commission
 * @param referredUser ID de l'utilisateur parrainé
 * @param planType Type de plan souscrit par l'utilisateur parrainé
 * @returns true si la transaction a été ajoutée avec succès, sinon false
 */
export async function addCommissionTransaction(
  userId: string, 
  amount: number, 
  referredUser: string, 
  planType: string
): Promise<boolean> {
  try {
    return await withRetry(async () => {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          gain: amount,
          report: `Commission de parrainage (${planType})`,
          date: new Date().toISOString().split('T')[0]
        });
        
      if (error) {
        throw createDetailedError(
          `Erreur lors de l'ajout de la transaction pour ${userId}`, 
          { userId, amount, referredUser, planType, supabaseError: error }
        );
      }
      
      console.log(`Transaction de commission ajoutée pour ${userId}: ${amount}€`);
      return true;
    }, 3, 1500); // Retry up to 3 times with 1.5s initial delay
  } catch (error) {
    console.error(`Exception lors de l'ajout de la transaction pour ${userId}:`, error);
    return false;
  }
}

/**
 * Récupère l'historique des transactions d'un utilisateur
 * @param userId ID de l'utilisateur
 * @param limit Nombre maximum de transactions à récupérer
 * @returns Un tableau des transactions de l'utilisateur
 */
export async function getUserTransactionHistory(userId: string, limit = 10): Promise<any[]> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);
        
      if (error) {
        throw createDetailedError(
          `Erreur lors de la récupération de l'historique des transactions pour ${userId}`, 
          { userId, limit, supabaseError: error }
        );
      }
      
      return data || [];
    }, 2, 1000); // Retry up to 2 times with 1s initial delay
  } catch (error) {
    console.error(`Exception lors de la récupération de l'historique des transactions:`, error);
    return [];
  }
}
