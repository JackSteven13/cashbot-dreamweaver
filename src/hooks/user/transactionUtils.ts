
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/userData";

/**
 * Récupérer les transactions d'un utilisateur depuis la base de données
 */
export const fetchUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (transactionsError) {
      console.error("Erreur lors de la récupération des transactions:", transactionsError);
      return [];
    }

    // Vérifier si les données existent
    if (!transactionsData || transactionsData.length === 0) {
      console.log("Aucune transaction trouvée pour l'utilisateur:", userId);
      return [];
    }
    
    console.log(`${transactionsData.length} transactions récupérées:`, transactionsData);
    
    // Mapper les données de la base de données vers notre interface Transaction
    return transactionsData.map(t => ({
      id: t.id, // Ensure id is included in the mapping
      date: t.date || new Date(t.created_at).toISOString().split('T')[0],
      amount: typeof t.gain === 'number' ? parseFloat(t.gain.toString()) : 0, 
      type: t.report || 'Transaction',
      report: t.report || '',
      gain: typeof t.gain === 'number' ? parseFloat(t.gain.toString()) : 0
    }));
  } catch (error) {
    console.error("Erreur dans fetchUserTransactions:", error);
    return [];
  }
};

/**
 * Ajouter une transaction pour un utilisateur
 */
export const addTransaction = async (
  userId: string, 
  gain: number, 
  report: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: gain,
        report: report,
        date: new Date().toISOString().split('T')[0]
      });
      
    if (error) {
      console.error("Erreur lors de l'ajout d'une transaction:", error);
      return false;
    }
    
    console.log(`Transaction ajoutée pour ${userId}: ${gain}€ - ${report}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ajout d'une transaction:", error);
    return false;
  }
};

// Removed the duplicate export here to fix the error
