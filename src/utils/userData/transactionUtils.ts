
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/userData';

/**
 * Fetch transactions for a given user
 */
export const fetchUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const response = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as any;
    
    const { data, error } = response;
    
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
    
    // Format transactions to adapt to application's required format
    return data.map((tx: any) => ({
      id: tx.id,
      date: tx.created_at,
      amount: tx.gain,
      type: tx.type,
      report: tx.description || tx.report, // Support both field names
      gain: tx.gain, // By convention, positive amounts are gains
    }));
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};

/**
 * Add a new transaction for a user
 */
export const addTransaction = async (
  userId: string,
  gain: number,
  description: string,
  type: string = 'system'
) => {
  try {
    const response = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: gain,
        report: description,
        type,
        date: new Date().toISOString().split('T')[0]
      }) as any;
    
    const { data, error } = response;
    
    if (error) {
      console.error("Error adding transaction:", error);
      return null;
    }
    
    return data ? data[0] : null;
  } catch (error) {
    console.error("Error in addTransaction:", error);
    return null;
  }
};

/**
 * Calculate today's total gains - critical for enforcing daily limits
 */
export const calculateTodaysGains = async (userId: string): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data, error } = await supabase
      .from('transactions')
      .select('gain')
      .eq('user_id', userId)
      .eq('date', today);
      
    if (error) {
      console.error("Error calculating today's gains:", error);
      return 0;
    }
    
    const total = (data || []).reduce((sum, tx) => sum + (tx.gain || 0), 0);
    console.log(`Today's total gains for ${userId}: ${total}€`);
    return total;
  } catch (error) {
    console.error("Error calculating today's gains:", error);
    return 0;
  }
};
