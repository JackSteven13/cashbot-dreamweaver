
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/userData";
import balanceManager from "../balance/balanceManager";

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
        
        // Use cache only if it exists and is less than 30 seconds old (reduced for better responsiveness)
        if (cachedTx && lastRefreshTime) {
          const cacheAge = Date.now() - parseInt(lastRefreshTime, 10);
          if (cacheAge < 30000) { // 30 seconds
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
    
    // Sync today's transactions with balance manager
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayTransactions = transactions.filter(tx => {
      try {
        return tx.date.startsWith(today);
      } catch (e) {
        console.error("Invalid transaction date:", tx.date, e);
        return false;
      }
    });
    
    const todayGains = todayTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    console.log(`Syncing daily gains: found ${todayTransactions.length} transactions totaling ${todayGains}€ for today (${today})`);
    
    // Update balance manager with today's gains
    balanceManager.setDailyGains(todayGains);
    
    return transactions;
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};

/**
 * Add a transaction for a user and trigger refresh events for real-time updates
 * Now ensures strict adherence to daily limits and proper transaction recording
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
    const dateString = isoString.split('T')[0]; // YYYY-MM-DD format
    
    console.log(`Adding transaction: ${gain}€ - ${report} for user ${userId}`);
    
    const { error, data } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: gain,
        report: report,
        created_at: isoString,
        date: dateString
      })
      .select();
      
    if (error) {
      console.error("Error adding transaction:", error);
      return false;
    }
    
    console.log("Transaction added successfully:", data);
    
    // Invalidate transaction cache immediately
    localStorage.removeItem('cachedTransactions');
    localStorage.removeItem('transactionsLastRefresh');
    
    // Trigger multiple refresh events to ensure UI updates
    window.dispatchEvent(new CustomEvent('transactions:refresh'));
    
    // Update balance manager daily gains
    balanceManager.addDailyGain(gain);
    
    // Also trigger refresh after a short delay to ensure database has propagated changes
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('transactions:refresh'));
    }, 1000);
    
    console.log(`Transaction recorded: ${gain}€ - ${report} with date ${dateString}`);
    return true;
  } catch (error) {
    console.error("Error adding transaction:", error);
    return false;
  }
};

/**
 * Get today's transactions for a user
 * Used for checking daily limits
 */
export const getTodaysTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', today)
      .lt('date', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]);
      
    if (error) {
      console.error("Error fetching today's transactions:", error);
      return [];
    }
    
    return (data || []).map(t => ({
      id: t.id,
      date: t.created_at || t.date,
      amount: t.gain,
      type: t.report,
      report: t.report,
      gain: t.gain
    }));
  } catch (error) {
    console.error("Error in getTodaysTransactions:", error);
    return [];
  }
};

/**
 * Calculate today's total gains from transactions
 * Critical for enforcing daily limits
 */
export const calculateTodaysGains = async (userId: string): Promise<number> => {
  const todaysTransactions = await getTodaysTransactions(userId);
  return todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
};
