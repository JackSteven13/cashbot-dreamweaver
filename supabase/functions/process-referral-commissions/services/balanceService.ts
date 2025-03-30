
import { supabase } from "../utils/supabaseClient.ts";

// Mettre à jour le solde de l'utilisateur
export async function updateUserBalance(userId: string, amount: number): Promise<boolean> {
  try {
    // Récupérer le solde actuel
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('id', userId)
      .maybeSingle();
      
    if (balanceError || !balanceData) {
      console.error(`Erreur lors de la récupération du solde pour ${userId}:`, balanceError);
      return false;
    }
    
    // Calculer le nouveau solde
    const newBalance = parseFloat(balanceData.balance) + amount;
    
    // Mettre à jour le solde
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', userId);
      
    if (updateError) {
      console.error(`Erreur lors de la mise à jour du solde pour ${userId}:`, updateError);
      return false;
    }
    
    console.log(`Solde mis à jour pour ${userId}: ${balanceData.balance}€ -> ${newBalance}€`);
    return true;
  } catch (error) {
    console.error(`Exception lors de la mise à jour du solde pour ${userId}:`, error);
    return false;
  }
}
