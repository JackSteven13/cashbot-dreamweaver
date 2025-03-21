
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Transaction } from "@/types/userData";
import { fetchUserReferrals, generateReferralLink } from "@/utils/referralUtils";

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
          try {
            // Try using RPC first
            const { error: createError } = await supabase
              .rpc('create_profile', {
                user_id: userData.user.id,
                user_name: userData.user.email?.split('@')[0] || 'utilisateur',
                user_email: userData.user.email || ''
              });
              
            if (createError) {
              console.error("Error creating profile with RPC:", createError);
              
              // Try direct insertion as fallback
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: userData.user.id,
                  full_name: userData.user.email?.split('@')[0] || 'utilisateur',
                  email: userData.user.email
                });
                
              if (insertError) {
                console.error("Error with direct profile insertion:", insertError);
                toast({
                  title: "Erreur de profil",
                  description: "Impossible de créer votre profil. Veuillez vous reconnecter.",
                  variant: "destructive"
                });
              }
            }
            
            // Fetch the newly created profile
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userData.user.id)
              .single();
              
            return newProfile;
          } catch (error) {
            console.error("Profile creation failed:", error);
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
    
    // Map database transactions to our Transaction interface
    return (transactionsData || []).map(t => ({
      date: t.date,
      amount: t.gain, // Map 'gain' to 'amount'
      type: t.report, // Use 'report' as transaction type
      report: t.report,
      gain: t.gain // Keep original gain for backward compatibility
    }));
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};

// Fetch complete user data including referrals
export const fetchCompleteUserData = async (userId: string, userEmail?: string | null) => {
  try {
    // Get profile
    const profile = await fetchUserProfile(userId, userEmail);
    
    // Get balance
    const balanceResult = await fetchUserBalance(userId);
    
    // Get transactions
    const transactions = await fetchUserTransactions(userId);
    
    // Get referrals
    const referrals = await fetchUserReferrals(userId);
    
    // Generate referral link
    const referralLink = generateReferralLink(userId);
    
    return {
      profile,
      balance: balanceResult?.data,
      transactions,
      referrals,
      referralLink,
      isNewUser: balanceResult?.isNewUser || false
    };
  } catch (error) {
    console.error("Error fetching complete user data:", error);
    return null;
  }
};
