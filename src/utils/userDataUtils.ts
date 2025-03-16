
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { SUBSCRIPTION_LIMITS } from "@/utils/subscriptionUtils";
import { UserData, Transaction } from "@/types/userData";

// Create or get user profile
export const fetchUserProfile = async (userId: string, userEmail?: string | null) => {
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
        }
      }
    }
  }

  return profileData;
};

// Fetch user balance data or create if not exists
export const fetchUserBalance = async (userId: string) => {
  const { data: userBalanceData, error: balanceError } = await supabase
    .from('user_balances')
    .select('*')
    .eq('id', userId)
    .single();

  if (balanceError) {
    console.error("Error fetching balance:", balanceError);
    
    // If balance not found, create a new entry
    if (balanceError.code === 'PGRST116') {
      const { data: newBalance, error: insertError } = await supabase
        .from('user_balances')
        .insert([{ id: userId }])
        .select();
        
      if (insertError) {
        console.error("Error creating balance:", insertError);
        return null;
      }
      
      return { data: newBalance[0], isNewUser: true };
    }
    
    return null;
  }
  
  return { data: userBalanceData, isNewUser: false };
};

// Fetch user transactions
export const fetchUserTransactions = async (userId: string) => {
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
};

// Update user balance
export const updateUserBalance = async (
  userId: string, 
  currentBalance: number, 
  gain: number,
  subscription: string
) => {
  // Ensure gain is always positive
  const positiveGain = Math.max(0, gain);
  const newBalance = parseFloat((currentBalance + positiveGain).toFixed(2));
  
  // Check if limit reached for freemium users
  const limitReached = 
    newBalance >= SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] && 
    subscription === 'freemium';
  
  try {
    // Update balance in database
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error updating balance:", updateError);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre solde. Veuillez réessayer.",
        variant: "destructive"
      });
      return { success: false };
    }
    
    return { success: true, newBalance, limitReached };
  } catch (error) {
    console.error("Error in updateBalance:", error);
    toast({
      title: "Erreur",
      description: "Une erreur est survenue. Veuillez réessayer.",
      variant: "destructive"
    });
    return { success: false };
  }
};

// Add transaction
export const addTransaction = async (userId: string, gain: number, report: string) => {
  try {
    // Add transaction in database
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        gain: gain,
        report: report
      }]);
      
    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return { success: false };
    }
    
    return { 
      success: true, 
      transaction: {
        date: new Date().toISOString().split('T')[0],
        gain: gain,
        report: report
      } 
    };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { success: false };
  }
};

// Reset user balance (for withdrawals)
export const resetUserBalance = async (userId: string, currentBalance: number) => {
  try {
    // Reset balance in database
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ 
        balance: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error resetting balance:", updateError);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre retrait. Veuillez réessayer.",
        variant: "destructive"
      });
      return { success: false };
    }
    
    const report = `Retrait de ${currentBalance.toFixed(2)}€ effectué avec succès. Le transfert vers votre compte bancaire est en cours.`;
    
    // Add withdrawal transaction result
    const transactionResult = await addTransaction(userId, -currentBalance, report);
    
    return { 
      success: true, 
      transaction: transactionResult.success ? transactionResult.transaction : null 
    };
  } catch (error) {
    console.error("Error in resetBalance:", error);
    toast({
      title: "Erreur",
      description: "Une erreur est survenue. Veuillez réessayer.",
      variant: "destructive"
    });
    return { success: false };
  }
};

// Update session count
export const updateSessionCount = async (userId: string, newCount: number) => {
  try {
    // Update session count in database
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ 
        daily_session_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error updating session count:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in incrementSessionCount:", error);
    return false;
  }
};
