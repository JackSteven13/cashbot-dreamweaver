
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/userData";
import balanceManager from "../balance/balanceManager";

/**
 * Fetch user transactions with improved date handling and auto-refresh
 */
export const fetchUserTransactions = async (userId: string, forceRefresh = false): Promise<Transaction[]> => {
  try {
    // Always force refresh if explicitly requested
    if (forceRefresh) {
      console.log("Forced refresh of transactions requested");
      localStorage.removeItem(`cachedTransactions_${userId}`);
      localStorage.removeItem(`transactionsLastRefresh_${userId}`);
    }

    // Check cache if forceRefresh isn't requested - with user-specific cache
    if (!forceRefresh) {
      try {
        const cachedTx = localStorage.getItem(`cachedTransactions_${userId}`);
        const lastRefreshTime = localStorage.getItem(`transactionsLastRefresh_${userId}`);
        
        // Use cache only if it exists and is less than 5 seconds old
        if (cachedTx && lastRefreshTime) {
          const cacheAge = Date.now() - parseInt(lastRefreshTime, 10);
          if (cacheAge < 5000) { // 5 seconds - short for better responsiveness
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
    
    if (!transactionsData || transactionsData.length === 0) {
      console.log("No transactions found for user:", userId);
      return [];
    }
    
    console.log(`${transactionsData.length} transactions retrieved from database for user ${userId}`);
    
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
    
    // Update cache for future requests - user specific cache
    try {
      localStorage.setItem(`cachedTransactions_${userId}`, JSON.stringify(transactions));
      localStorage.setItem(`transactionsLastRefresh_${userId}`, Date.now().toString());
    } catch (e) {
      console.warn("Cache write error:", e);
    }
    
    // Sync today's transactions with balance manager
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayTransactions = transactions.filter(tx => {
      try {
        return tx.date.startsWith(today);
      } catch (e) {
        console.error("Invalid transaction date:", e, tx.date);
        return false;
      }
    });
    
    const todayGains = todayTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    console.log(`Syncing daily gains: found ${todayTransactions.length} transactions totaling ${todayGains}€ for today (${today})`);
    
    // Update balance manager with today's gains
    balanceManager.setDailyGains(todayGains);
    
    // Calculate total balance from all transactions to ensure consistency
    const totalBalance = transactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    console.log(`Total balance from all transactions: ${totalBalance.toFixed(2)}€`);
    
    // Force balance sync if there's a significant discrepancy
    const currentBalance = balanceManager.getCurrentBalance();
    if (Math.abs(totalBalance - currentBalance) > 0.1) {
      console.log(`Balance discrepancy detected: Manager=${currentBalance.toFixed(2)}€, Transactions=${totalBalance.toFixed(2)}€`);
      
      // Always use the highest value to prevent user frustration
      if (totalBalance > currentBalance) {
        console.log(`Updating balance to match transactions total: ${currentBalance.toFixed(2)}€ -> ${totalBalance.toFixed(2)}€`);
        balanceManager.forceBalanceSync(totalBalance);
        
        // Trigger UI update
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: {
            newBalance: totalBalance,
            source: 'transactions-total'
          }
        }));
      }
    }
    
    return transactions;
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};

/**
 * Add a transaction for a user and trigger refresh events for real-time updates
 * Ensures strict adherence to daily limits and proper transaction recording
 */
export const addTransaction = async (
  userId: string,
  gain: number, 
  report: string
): Promise<{success: boolean, transaction: any | null}> => {
  try {
    // Use current date (today) for all new transactions
    const today = new Date();
    const isoString = today.toISOString();
    const dateString = isoString.split('T')[0]; // YYYY-MM-DD format
    
    console.log(`Adding transaction: ${gain}€ - ${report} for user ${userId}`);
    
    // Format gain to 2 decimal places for consistency
    const formattedGain = parseFloat(gain.toFixed(2));
    
    const { error, data } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: formattedGain,
        report: report,
        created_at: isoString,
        date: dateString
      })
      .select();
      
    if (error) {
      console.error("Error adding transaction:", error);
      return { success: false, transaction: null };
    }
    
    console.log("Transaction added successfully:", data);
    
    // Immediately invalidate transaction cache to ensure fresh data
    localStorage.removeItem(`cachedTransactions_${userId}`);
    localStorage.removeItem(`transactionsLastRefresh_${userId}`);
    
    // Trigger multiple refresh events to ensure UI updates
    window.dispatchEvent(new CustomEvent('transactions:refresh', {
      detail: { timestamp: Date.now(), forceRefresh: true, userId }
    }));
    
    // Update balance manager daily gains
    balanceManager.addDailyGain(formattedGain);
    
    // Also trigger refresh after a short delay to ensure database has propagated changes
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('transactions:refresh', {
        detail: { timestamp: Date.now(), forceRefresh: true, userId }
      }));
    }, 500);
    
    console.log(`Transaction recorded: ${formattedGain}€ - ${report} with date ${dateString}`);
    
    return { 
      success: true, 
      transaction: data ? data[0] : { date: dateString, gain: formattedGain, report } 
    };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { success: false, transaction: null };
  }
};

/**
 * Get today's transactions for a user - critical for enforcing daily limits
 */
export const getTodaysTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);
      
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
 * Calculate today's total gains - critical for enforcing daily limits
 */
export const calculateTodaysGains = async (userId: string): Promise<number> => {
  try {
    const todaysTransactions = await getTodaysTransactions(userId);
    const total = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    console.log(`Today's total gains for ${userId}: ${total}€`);
    return total;
  } catch (error) {
    console.error("Error calculating today's gains:", error);
    return 0;
  }
};
