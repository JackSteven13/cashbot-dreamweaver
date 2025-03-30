
import { supabase } from "../utils/supabaseClient.ts";

// Ajouter une transaction pour une commission
export async function addCommissionTransaction(
  userId: string, 
  amount: number, 
  referredUser: string, 
  planType: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: amount,
        report: `Commission de parrainage (${planType})`,
        date: new Date().toISOString().split('T')[0]
      });
      
    if (error) {
      console.error(`Erreur lors de l'ajout de la transaction pour ${userId}:`, error);
      return false;
    }
    
    console.log(`Transaction de commission ajoutée pour ${userId}: ${amount}€`);
    return true;
  } catch (error) {
    console.error(`Exception lors de l'ajout de la transaction pour ${userId}:`, error);
    return false;
  }
}
