
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
    
    return { data: userBalanceData, isNewUser: false };
  } catch (error) {
    console.error("Error in fetchUserBalance:", error);
    return null;
  }
};
