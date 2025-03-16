
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "./errorHandling";

// Update session count with retry mechanism
export const updateSessionCount = async (userId: string, newCount: number) => {
  // Cache local progress to avoid duplicate calls
  const cacheKey = `sessionUpdate_${userId}_${Date.now()}`;
  const updateInProgress = window.sessionStorage.getItem(cacheKey);
  
  if (updateInProgress) {
    console.log('Session count update already in progress, skipping duplicate call');
    return true;
  }
  
  window.sessionStorage.setItem(cacheKey, 'true');
  
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
          window.sessionStorage.removeItem(cacheKey);
          return handleError(updateError, "Error updating session count");
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
        continue;
      }
      
      console.log("Session count updated successfully");
      window.sessionStorage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.error("Error in updateSessionCount (attempt " + (retryCount + 1) + "):", error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        window.sessionStorage.removeItem(cacheKey);
        return handleError(error, "Exception in updateSessionCount");
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
    }
  }
  
  window.sessionStorage.removeItem(cacheKey);
  return false;
};
