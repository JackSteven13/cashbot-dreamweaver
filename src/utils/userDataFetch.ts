
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Transaction } from "@/types/userData";

// Create or get user profile
export const fetchUserProfile = async (userId: string, userEmail?: string | null) => {
  try {
    // Get user profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      
      // If no profile found, try to create one
      if (profileError.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { error: createError } = await supabase
            .rpc('create_profile', {
              user_id: userData.user.id,
              user_name: userData.user.email?.split('@')[0] || 'utilisateur',
              user_email: userData.user.email || ''
            });
            
          if (createError) {
            console.error("Error creating profile:", createError);
            // Tentative directe d'insertion
            await supabase
              .from('profiles')
              .insert({
                id: userData.user.id,
                full_name: userData.user.email?.split('@')[0] || 'utilisateur',
                email: userData.user.email
              });
          }
        }
      }
    }

    return profileData;
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return null;
  }
};

// Fetch user balance data or create if not exists
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
        // Creation directe sans utiliser d'insertion
        const { data: newBalance, error: insertError } = await supabase
          .rpc('create_user_balance', {
            user_id: userId
          });
          
        if (insertError) {
          console.error("Error creating balance:", insertError);
          // Si la fonction RPC échoue, on tente d'insérer directement avec la politique RLS correcte
          const { data: directInsert, error: directError } = await supabase
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
            
          if (directError) {
            console.error("Direct insert error:", directError);
            return null;
          }
          
          return { data: directInsert?.[0], isNewUser: true };
        }
        
        return { data: newBalance, isNewUser: true };
      }
      
      return null;
    }
    
    return { data: userBalanceData, isNewUser: false };
  } catch (error) {
    console.error("Error in fetchUserBalance:", error);
    return null;
  }
};

// Fetch user transactions
export const fetchUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return [];
    }
    
    return transactionsData || [];
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};
