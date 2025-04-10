
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { SUBSCRIPTION_LIMITS } from "@/utils/subscription";
import { balanceManager } from "./balanceManager";

// Update user balance with retry mechanism
export const updateUserBalance = async (
  userId: string, 
  currentBalance: number, 
  gain: number,
  subscription: string
) => {
  // Ensure gain is always positive and has max 2 decimal places
  const positiveGain = Math.max(0, parseFloat(gain.toFixed(2)));
  
  // Utiliser le gestionnaire centralisé pour la valeur la plus fiable
  const latestBalance = balanceManager.getCurrentBalance();
  // Toujours utiliser la valeur la plus élevée comme référence
  const effectiveCurrentBalance = Math.max(currentBalance, latestBalance);
  
  // Calculer le nouveau solde
  const newBalance = parseFloat((effectiveCurrentBalance + positiveGain).toFixed(2));
  
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
  
  // Check if daily limit reached (for warnings only)
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  const limitReached = todaysGains >= dailyLimit;
  
  // Retry mechanism
  const maxRetries = 3;
  let retryCount = 0;
  let success = false;
  
  while (retryCount < maxRetries && !success) {
    try {
      console.log(`Updating balance from ${effectiveCurrentBalance} to ${newBalance} for user ${userId} (attempt ${retryCount + 1}/${maxRetries})`);
      console.log(`Today's gains: ${todaysGains}/${dailyLimit}`);
      
      // ALWAYS update the balance regardless of daily limit
      // The daily limit only restricts how much can be earned in a day, not the total balance
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
          return { success: false, newBalance: effectiveCurrentBalance, limitReached: false };
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
      } else {
        success = true;
        
        // Only log if we got a gain worth mentioning
        if (positiveGain > 0.01) {
          console.log("Balance updated successfully to", newBalance, "DB returned:", data?.[0]?.balance);
        }
        
        // Mettre à jour le gestionnaire central de solde
        const dbReturnedBalance = data?.[0]?.balance;
        if (typeof dbReturnedBalance === 'number' && !isNaN(dbReturnedBalance)) {
          // Initialisation du gestionnaire avec la valeur de la base
          balanceManager.initialize(dbReturnedBalance);
        } else {
          // Sinon, mettre à jour avec la valeur calculée localement
          balanceManager.updateBalance(positiveGain);
        }
        
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
        return { success: false, newBalance: effectiveCurrentBalance, limitReached: false };
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
    }
  }
  
  // This should not be reached but added as a fallback
  return { success: false, newBalance: effectiveCurrentBalance, limitReached: false };
};
