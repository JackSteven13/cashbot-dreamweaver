
import { supabase } from "@/integrations/supabase/client";

// Add transaction with retry mechanism
export const addTransaction = async (userId: string, gain: number, report: string) => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Adding transaction for user ${userId} (gain: ${gain}, attempt: ${retryCount + 1}/${maxRetries})`);
      
      // Format the gain to 2 decimal places
      const formattedGain = parseFloat(gain.toFixed(2));
      
      // Add transaction in database
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
          gain: formattedGain,
          report: report
        }]);
        
      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          return { success: false };
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
        continue;
      }
      
      // Déclencher un événement pour informer que la transaction a été ajoutée
      window.dispatchEvent(new CustomEvent('transactions:refresh', { 
        detail: { userId, gain: formattedGain, report }
      }));
      
      return { 
        success: true, 
        transaction: {
          date: new Date().toISOString().split('T')[0],
          gain: formattedGain,
          report: report
        } 
      };
    } catch (error) {
      console.error(`Error adding transaction (attempt ${retryCount + 1}):`, error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        return { success: false };
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
    }
  }
  
  return { success: false };
};

