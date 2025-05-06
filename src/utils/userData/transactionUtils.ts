
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/userData';

/**
 * Fetch user transactions with proper typing
 * @param userId ID of the user
 * @returns A list of transactions
 */
export const fetchUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    // Get today's date in ISO format
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    // Fetch transactions from the database
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }

    // Map the data to Transaction type
    return (data || []).map(tx => ({
      id: tx.id,
      date: tx.created_at || tx.date,
      gain: tx.gain,
      amount: tx.gain, // For backward compatibility
      report: tx.report,
      type: tx.type || 'system' // Add fallback to 'system' if type doesn't exist
    }));
  } catch (err) {
    console.error("Error in fetchUserTransactions:", err);
    return [];
  }
};

/**
 * Calculate today's gains for a user
 * @param userId ID of the user
 * @returns The total gains for today
 */
export const calculateTodaysGains = async (userId: string): Promise<number> => {
  try {
    // Get today's date in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    // Fetch transactions for today
    const { data, error } = await supabase
      .from('transactions')
      .select('gain')
      .eq('user_id', userId)
      .gte('created_at', todayStr);
    
    if (error) {
      console.error("Error calculating today's gains:", error);
      return 0;
    }
    
    // Calculate the sum of gains
    return data?.reduce((sum, transaction) => sum + Number(transaction.gain), 0) || 0;
  } catch (err) {
    console.error("Error in calculateTodaysGains:", err);
    return 0;
  }
};

/**
 * Calculate today's expenses for a user
 * @param userId ID of the user
 * @returns The total expenses for today
 */
export const calculateTodaysExpenses = async (userId: string): Promise<number> => {
  try {
    // Get today's date in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    // Fetch transactions for today
    const { data, error } = await supabase
      .from('transactions')
      .select('gain')
      .eq('user_id', userId)
      .gte('created_at', todayStr);
    
    if (error) {
      console.error("Error calculating today's expenses:", error);
      return 0;
    }
    
    // Calculate the sum of expenses (all negative gains)
    return data?.reduce((sum, transaction) => {
      const amount = Number(transaction.gain);
      return sum + (amount < 0 ? Math.abs(amount) : 0);
    }, 0) || 0;
  } catch (err) {
    console.error("Error in calculateTodaysExpenses:", err);
    return 0;
  }
};

/**
 * Get transaction history for a user with pagination
 * @param userId ID of the user
 * @param page Current page number
 * @param pageSize Number of transactions per page
 * @returns List of transactions and total count
 */
export const getTransactionHistory = async (userId: string, page: number, pageSize: number) => {
  const startIndex = (page - 1) * pageSize;

  try {
    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + pageSize - 1);

    if (error) {
      console.error("Error fetching transaction history:", error);
      return { data: [], count: 0 };
    }

    return { 
      data: data?.map(tx => ({
        id: tx.id,
        date: tx.created_at || tx.date,
        gain: tx.gain,
        amount: tx.gain, // For backward compatibility
        report: tx.report,
        type: tx.type || 'system' // Add fallback to 'system' if type doesn't exist
      })) || [], 
      count: count || 0 
    };
  } catch (err) {
    console.error("Error in getTransactionHistory:", err);
    return { data: [], count: 0 };
  }
};

/**
 * Add a transaction for a user
 * @param userId ID of the user
 * @param gain Amount of the transaction
 * @param report Description of the transaction
 * @param type Type of the transaction
 * @returns The created transaction
 */
export const addTransaction = async (
  userId: string,
  gain: number,
  report: string,
  type: string = 'system'
) => {
  try {
    // Format gain to 2 decimal places
    const formattedGain = parseFloat(gain.toFixed(2));
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: formattedGain,
        report: report,
        type: type,
        date: new Date().toISOString().split('T')[0]
      })
      .select();
    
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
 * Get today's transactions for a user
 * @param userId ID of the user
 * @returns List of today's transactions
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
      gain: t.gain,
      report: t.report,
      type: t.type || 'system' // Add fallback to 'system' if type doesn't exist
    }));
  } catch (error) {
    console.error("Error in getTodaysTransactions:", error);
    return [];
  }
};
