
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/userData";

/**
 * Fetch user transactions
 */
export const fetchUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return [];
    }
    
    // Map database transactions to our Transaction interface
    return (transactionsData || []).map(t => ({
      date: t.date,
      amount: t.gain, // Map 'gain' to 'amount'
      type: t.report, // Use 'report' as transaction type
      report: t.report,
      gain: t.gain // Keep original gain for backward compatibility
    }));
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};
