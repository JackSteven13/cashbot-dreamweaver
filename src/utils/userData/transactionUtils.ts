
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/userData';

/**
 * Fetch transactions for a given user with date handling improvements
 */
export const fetchUserTransactions = async (userId: string, forceRefresh = false): Promise<Transaction[]> => {
  try {
    // Check in cache if forceRefresh isn't requested
    if (!forceRefresh) {
      try {
        const cachedTx = localStorage.getItem('cachedTransactions');
        const lastRefreshTime = localStorage.getItem('transactionsLastRefresh');
        
        // Use cache only if it exists and is less than 1 minute old (reduced from 5 minutes)
        if (cachedTx && lastRefreshTime) {
          const cacheAge = Date.now() - parseInt(lastRefreshTime, 10);
          if (cacheAge < 60000) { // 1 minute - reduced to make transactions appear faster
            return JSON.parse(cachedTx);
          }
        }
      } catch (e) {
        console.warn("Cache access error:", e);
      }
    }

    console.log(`Fetching transactions for user ${userId}, force refresh: ${forceRefresh}`);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
    
    console.log("Raw transaction data:", data);
    
    // Format transactions to adapt to application's required format
    const formattedTransactions = data.map((tx: any) => {
      // Normalize date for consistent comparison
      let txDate;
      if (tx.created_at) {
        txDate = new Date(tx.created_at);
      } else if (tx.date) {
        txDate = new Date(tx.date);
      } else {
        txDate = new Date(); // Fallback to current date if no date field exists
      }
      
      // ISO format for consistency
      const isoDate = txDate.toISOString();
      
      return {
        id: tx.id,
        date: isoDate,
        amount: tx.gain,
        type: tx.type || 'system',
        report: tx.report || tx.description || 'Transaction',
        gain: tx.gain, // By convention, positive amounts are gains
      };
    });
    
    // Update cache
    try {
      localStorage.setItem('cachedTransactions', JSON.stringify(formattedTransactions));
      localStorage.setItem('transactionsLastRefresh', Date.now().toString());
    } catch (e) {
      console.warn("Cache write error:", e);
    }
    
    // Debug today's transactions
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const todayTransactions = formattedTransactions.filter(tx => {
      try {
        const txDate = new Date(tx.date);
        const txDateString = txDate.toISOString().split('T')[0];
        return txDateString === todayString;
      } catch (e) {
        return false;
      }
    });
    
    console.log(`Transactions retrieved for today (${todayString}): ${todayTransactions.length}/${formattedTransactions.length}`);
    console.log("Today's transactions:", todayTransactions);
    
    return formattedTransactions;
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};

/**
 * Add a new transaction for a user with improved date handling
 */
export const addTransaction = async (
  userId: string,
  gain: number,
  description: string,
  type: string = 'system'
) => {
  try {
    // Get today's date in consistent format
    const today = new Date();
    const isoString = today.toISOString();
    const dateString = isoString.split('T')[0]; // YYYY-MM-DD
    
    // Format gain to 3 decimal places maximum
    const formattedGain = parseFloat(gain.toFixed(3));
    
    console.log(`Adding transaction for ${userId}: ${formattedGain}€ - ${description}`);
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: formattedGain,
        report: description,
        type,
        created_at: isoString,
        date: dateString  // Explicitly set date in YYYY-MM-DD format
      })
      .select();
    
    if (error) {
      console.error("Error adding transaction:", error);
      return null;
    }
    
    console.log("Transaction added successfully:", data);
    
    // Invalidate cache to force refresh
    localStorage.removeItem('cachedTransactions');
    localStorage.removeItem('transactionsLastRefresh');
    
    // Trigger refresh events
    window.dispatchEvent(new CustomEvent('transactions:refresh', {
      detail: { timestamp: Date.now() }
    }));
    
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: { gain: formattedGain, automatic: true }
    }));
    
    return data ? data[0] : null;
  } catch (error) {
    console.error("Error in addTransaction:", error);
    return null;
  }
};

/**
 * Calculate today's total gains for a user
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
    
    const totalGains = data.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    console.log(`Today's total gains for ${userId}: ${totalGains}€`);
    
    return totalGains;
  } catch (error) {
    console.error("Error in calculateTodaysGains:", error);
    return 0;
  }
};
