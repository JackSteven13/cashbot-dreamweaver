
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/userData";

/**
 * Fetch user transactions with improved date handling and auto-refresh
 */
export const fetchUserTransactions = async (userId: string, forceRefresh = false): Promise<Transaction[]> => {
  try {
    // Check cache if forceRefresh isn't requested
    if (!forceRefresh) {
      try {
        const cachedTx = localStorage.getItem('cachedTransactions');
        const lastRefreshTime = localStorage.getItem('transactionsLastRefresh');
        
        // Use cache only if it exists and is less than 2 minutes old (reduced from 5 minutes)
        if (cachedTx && lastRefreshTime) {
          const cacheAge = Date.now() - parseInt(lastRefreshTime, 10);
          if (cacheAge < 120000) { // 2 minutes
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
      
      const isoDate = txDate.toISOString();
      
      return {
        id: t.id,
        date: isoDate, // Store as ISO format for consistency
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
    
    // Log today's transactions for debugging
    const today = new Date();
    const todayTransactions = transactions.filter(tx => {
      try {
        const txDate = new Date(tx.date);
        return (
          txDate.getFullYear() === today.getFullYear() &&
          txDate.getMonth() === today.getMonth() &&
          txDate.getDate() === today.getDate()
        );
      } catch (e) {
        console.error("Invalid transaction date:", tx.date, e);
        return false;
      }
    });
    
    console.log(`Found ${todayTransactions.length}/${transactions.length} transactions for today (${today.toISOString().split('T')[0]})`);
    
    return transactions;
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};

/**
 * Add a transaction for a user and trigger refresh events for real-time updates
 */
export const addTransaction = async (
  userId: string,
  gain: number, 
  report: string
): Promise<boolean> => {
  try {
    // Use current date (today) for all new transactions
    const today = new Date();
    const isoString = today.toISOString();
    
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: gain,
        report: report,
        created_at: isoString,
        date: isoString.split('T')[0]  // Store YYYY-MM-DD format for the date column
      });
      
    if (error) {
      console.error("Error adding transaction:", error);
      return false;
    }
    
    // Invalidate transaction cache
    localStorage.removeItem('cachedTransactions');
    localStorage.removeItem('transactionsLastRefresh');
    
    // Trigger multiple refresh events to ensure UI updates
    window.dispatchEvent(new CustomEvent('transactions:refresh'));
    
    // Also trigger refresh after a short delay to ensure database has propagated changes
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('transactions:refresh'));
    }, 1000);
    
    console.log(`Transaction added for ${userId}: ${gain}€ - ${report} with date ${isoString}`);
    return true;
  } catch (error) {
    console.error("Error adding transaction:", error);
    return false;
  }
};
