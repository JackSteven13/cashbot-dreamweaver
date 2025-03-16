
import { supabase } from "@/integrations/supabase/client";

// Add transaction
export const addTransaction = async (userId: string, gain: number, report: string) => {
  try {
    // Add transaction in database
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        gain: gain,
        report: report
      }]);
      
    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return { success: false };
    }
    
    return { 
      success: true, 
      transaction: {
        date: new Date().toISOString().split('T')[0],
        gain: gain,
        report: report
      } 
    };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { success: false };
  }
};
