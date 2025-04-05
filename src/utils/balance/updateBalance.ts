
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
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate today's gains for limit checking
  const { data: todaysTransactions } = await supabase
    .from('transactions')
    .select('gain')
    .eq('user_id', userId)
    .gte('date', today)
    .lt('date', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString());
    
  const todaysGains = (todaysTransactions || []).reduce((sum, tx) => sum + (tx.gain || 0), 0) + positiveGain;
  
  // Check if daily limit reached for freemium users (not total balance)
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  const limitReached = todaysGains >= dailyLimit && subscription === 'freemium';
  
  // Retry mechanism
  const maxRetries = 3;
  let retryCount = 0;
  let success = false;
  
  while (retryCount < maxRetries && !success) {
    try {
      console.log(`Updating balance from ${currentBalance} to ${newBalance} for user ${userId} (attempt ${retryCount + 1}/${maxRetries})`);
      console.log(`Today's gains: ${todaysGains}/${dailyLimit}`);
      
      // Use standard update instead of RPC to avoid TypeScript errors
      const { data, error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('balance');
      
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
        console.log("Balance updated successfully to", newBalance, "DB returned:", data?.[0]?.balance);
        return { 
          success: true, 
          newBalance: data?.[0]?.balance || newBalance, // Use DB value if available
          limitReached 
        };
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
