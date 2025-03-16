
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { SUBSCRIPTION_LIMITS } from "@/utils/subscriptionUtils";

// Update user balance with retry mechanism
export const updateUserBalance = async (
  userId: string, 
  currentBalance: number, 
  gain: number,
  subscription: string
) => {
  // Ensure gain is always positive and has max 2 decimal places
  const positiveGain = Math.max(0, parseFloat(gain.toFixed(2)));
  const newBalance = parseFloat((currentBalance + positiveGain).toFixed(2));
  
  // Check if limit reached for freemium users
  const limitReached = 
    newBalance >= SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] && 
    subscription === 'freemium';
  
  // Retry mechanism
  const maxRetries = 3;
  let retryCount = 0;
  let success = false;
  
  while (retryCount < maxRetries && !success) {
    try {
      console.log(`Updating balance from ${currentBalance} to ${newBalance} for user ${userId} (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Use standard update instead of RPC to avoid TypeScript errors
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Error updating balance:", updateError);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour votre solde. Veuillez réessayer.",
            variant: "destructive"
          });
          return { success: false, newBalance: currentBalance, limitReached: false };
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
      } else {
        success = true;
        console.log("Balance updated successfully to", newBalance);
        return { success: true, newBalance, limitReached };
      }
    } catch (error) {
      console.error("Error in updateBalance (attempt " + (retryCount + 1) + "):", error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue. Veuillez réessayer.",
          variant: "destructive"
        });
        return { success: false, newBalance: currentBalance, limitReached: false };
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
    }
  }
  
  // This should not be reached but added as a fallback
  return { success: false, newBalance: currentBalance, limitReached: false };
};
