
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/userData";

/**
 * Fetch user transactions with improved date handling
 */
export const fetchUserTransactions = async (userId: string, forceRefresh = false): Promise<Transaction[]> => {
  try {
    // Check cache if forceRefresh isn't requested
    if (!forceRefresh) {
      try {
        const cachedTx = localStorage.getItem('cachedTransactions');
        const lastRefreshTime = localStorage.getItem('transactionsLastRefresh');
        
        // Use cache only if it exists and is less than 5 minutes old
        if (cachedTx && lastRefreshTime) {
          const cacheAge = Date.now() - parseInt(lastRefreshTime, 10);
          if (cacheAge < 300000) { // 5 minutes
            return JSON.parse(cachedTx);
          }
        }
      } catch (e) {
        console.warn("Cache access error:", e);
      }
    }

    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return [];
    }
    
    // Map database transactions to our Transaction interface with proper date handling
    const transactions = (transactionsData || []).map(t => {
      // Ensure we get a valid date (use the most specific field available)
      const txDate = t.created_at ? new Date(t.created_at) : 
                     t.date ? new Date(t.date) : 
                     new Date();
      
      return {
        id: t.id,
        date: txDate.toISOString(), // Store as ISO format for consistency
        amount: t.gain,
        type: t.report,
        report: t.report,
        gain: t.gain
      };
    });
    
    // Update cache for future requests
    try {
      localStorage.setItem('cachedTransactions', JSON.stringify(transactions));
      localStorage.setItem('transactionsLastRefresh', Date.now().toString());
    } catch (e) {
      console.warn("Cache write error:", e);
    }
    
    // Log if there are any transactions from today
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(tx => {
      try {
        return new Date(tx.date).toISOString().split('T')[0] === today;
      } catch (e) {
        return false;
      }
    });
    
    console.log(`Found ${todayTransactions.length} transactions for today (${today})`);
    
    return transactions;
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};

/**
 * Add a transaction for a user
 */
export const addTransaction = async (
  userId: string,
  gain: number, 
  report: string
): Promise<boolean> => {
  try {
    // Use current date (today) for all new transactions
    const today = new Date();
    
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: gain,
        report: report,
        created_at: today.toISOString(),
        date: today.toISOString().split('T')[0]
      });
      
    if (error) {
      console.error("Error adding transaction:", error);
      return false;
    }
    
    // Invalidate transaction cache
    localStorage.removeItem('cachedTransactions');
    
    console.log(`Transaction added for ${userId}: ${gain}€ - ${report} with date ${today.toISOString()}`);
    return true;
  } catch (error) {
    console.error("Error adding transaction:", error);
    return false;
  }
};
