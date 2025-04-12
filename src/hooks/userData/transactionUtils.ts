
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/userData';

/**
 * Récupère les transactions pour un utilisateur donné
 */
export const fetchUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
    
    // Formater les transactions pour les adapter au format requis par l'application
    return data.map((tx: any) => ({
      id: tx.id,
      date: tx.created_at,
      amount: tx.amount,
      type: tx.type,
      report: tx.description,
      gain: tx.amount, // Par convention, les montants positifs sont des gains
    }));
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};

/**
 * Ajoute une nouvelle transaction pour un utilisateur
 */
export const addTransaction = async (
  userId: string,
  amount: number,
  description: string,
  type: string = 'system'
) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount,
        description,
        type
      })
      .select();
    
    if (error) {
      console.error("Error adding transaction:", error);
      return null;
    }
    
    return data[0];
  } catch (error) {
    console.error("Error in addTransaction:", error);
    return null;
  }
};
