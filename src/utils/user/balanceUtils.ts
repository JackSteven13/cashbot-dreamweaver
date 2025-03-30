
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Fetch user balance data or create if not exists
 */
export const fetchUserBalance = async (userId: string) => {
  try {
    const { data: userBalanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('*')
      .eq('id', userId)
      .single();

    if (balanceError) {
      console.error("Error fetching balance:", balanceError);
      
      // If balance not found, create a new entry
      if (balanceError.code === 'PGRST116') {
        try {
          // Try using RPC first
          const { data: newBalance, error: rpcError } = await supabase
            .rpc('create_user_balance', {
              user_id: userId
            });
            
          if (rpcError) {
            console.error("Error creating balance with RPC:", rpcError);
            
            // Try direct insertion as fallback
            const { data: directInsert, error: insertError } = await supabase
              .from('user_balances')
              .insert([
                { 
                  id: userId, 
                  balance: 0, 
                  daily_session_count: 0, 
                  subscription: 'freemium' 
                }
              ])
              .select();
              
            if (insertError) {
              console.error("Direct insert error:", insertError);
              toast({
                title: "Erreur d'initialisation",
                description: "Impossible d'initialiser votre compte. Veuillez vous reconnecter.",
                variant: "destructive"
              });
              return null;
            }
            
            return { data: directInsert?.[0], isNewUser: true };
          }
          
          // If array returned, get first element
          const balanceData = Array.isArray(newBalance) ? newBalance[0] : newBalance;
          return { data: balanceData, isNewUser: true };
          
        } catch (error) {
          console.error("Balance creation failed:", error);
          return null;
        }
      }
      
      return null;
    }
    
    // Check if the account should be temporarily restricted based on high performance
    const shouldRestrictAccount = checkIfAccountShouldBeTemporarilyRestricted(userBalanceData);
    if (shouldRestrictAccount) {
      await markAccountForReview(userId);
      toast({
        title: "Vérification de compte requise",
        description: "Votre compte a été temporairement suspendu pour vérification. Cela peut prendre 24-48h.",
        variant: "destructive"
      });
    }
    
    return { data: userBalanceData, isNewUser: false };
  } catch (error) {
    console.error("Error in fetchUserBalance:", error);
    return null;
  }
};

/**
 * Check if an account should be temporarily restricted based on performance
 * This implements a mechanism to occasionally flag high-performing accounts for verification
 */
const checkIfAccountShouldBeTemporarilyRestricted = (userData: any): boolean => {
  // Skip if already under review
  if (userData.pro_trial_used) {
    // We'll use the pro_trial_used field as a flag for account restriction temporarily
    // since we don't have an account_frozen field in the schema
    return false;
  }
  
  // Probability increases based on balance and activity level
  const baseRestrictProbability = 0.002; // 0.2% base chance
  
  // Increase probability for accounts with high balances
  let restrictProbability = baseRestrictProbability;
  
  // Balance factors - higher balances have higher restriction probability
  if (userData.balance > 800) {
    restrictProbability += 0.03; // +3%
  } else if (userData.balance > 500) {
    restrictProbability += 0.015; // +1.5%
  } else if (userData.balance > 200) {
    restrictProbability += 0.005; // +0.5%
  }
  
  // Higher-tier subscriptions have lower restriction probability (better "protection")
  if (userData.subscription === 'freemium') {
    restrictProbability += 0.02; // +2% for freemium
  } else if (userData.subscription === 'starter') {
    restrictProbability += 0.01; // +1% for starter
  }
  
  // Random check based on calculated probability
  return Math.random() < restrictProbability;
};

/**
 * Temporarily mark an account for review
 * Since we don't have dedicated fields for this, we'll use the pro_trial_used field as a flag
 * and store review info in a transaction record
 */
const markAccountForReview = async (userId: string): Promise<boolean> => {
  try {
    // Update user balance to mark it for review
    const { error } = await supabase
      .from('user_balances')
      .update({
        pro_trial_used: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Error marking account for review:", error);
      return false;
    }
    
    // Log the review event as a transaction
    const reviewMessage = 'Vérification de routine - activité inhabituelle';
    const reviewEndDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 48 hours
    
    await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          report: `Compte en vérification jusqu'au ${new Date(reviewEndDate).toLocaleDateString()}. Raison: ${reviewMessage}`,
          gain: 0
        }
      ]);
      
    return true;
  } catch (error) {
    console.error("Error in markAccountForReview:", error);
    return false;
  }
};
