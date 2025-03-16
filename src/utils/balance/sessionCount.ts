
import { supabase } from "@/integrations/supabase/client";

// Update session count with retry mechanism
export const updateSessionCount = async (userId: string, newCount: number) => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Updating session count to ${newCount} for user ${userId} (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Use standard update instead of RPC to avoid TypeScript errors
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          daily_session_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error("Error updating session count:", updateError);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          return false;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
        continue;
      }
      
      console.log("Session count updated successfully");
      return true;
    } catch (error) {
      console.error("Error in updateSessionCount (attempt " + (retryCount + 1) + "):", error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        return false;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
    }
  }
  
  return false;
};
