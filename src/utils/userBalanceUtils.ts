
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { SUBSCRIPTION_LIMITS } from "@/utils/subscriptionUtils";
import { addTransaction } from './transactionUtils';

// Utility function to handle errors and display toast messages
const handleError = (error: any, errorMessage: string) => {
  console.error(errorMessage, error);
  toast({
    title: "Erreur",
    description: "Une erreur est survenue. Veuillez réessayer.",
    variant: "destructive"
  });
  return false;
};

// Update user balance
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
  
  try {
    console.log("Updating balance from", currentBalance, "to", newBalance, "for user", userId);
    
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
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre solde. Veuillez réessayer.",
        variant: "destructive"
      });
      return { success: false, newBalance: currentBalance, limitReached: false };
    }
    
    console.log("Balance updated successfully to", newBalance);
    return { success: true, newBalance, limitReached };
  } catch (error) {
    console.error("Error in updateBalance:", error);
    toast({
      title: "Erreur",
      description: "Une erreur est survenue. Veuillez réessayer.",
      variant: "destructive"
    });
    return { success: false, newBalance: currentBalance, limitReached: false };
  }
};

// Reset user balance (for withdrawals)
export const resetUserBalance = async (userId: string, currentBalance: number) => {
  try {
    console.log("Resetting balance from", currentBalance, "to 0 for user", userId);
    
    // Use standard update instead of RPC to avoid TypeScript errors
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
      return { success: false, transaction: null };
    }
    
    const report = `Retrait de ${currentBalance.toFixed(2)}€ effectué avec succès. Le transfert vers votre compte bancaire est en cours.`;
    
    // Add withdrawal transaction result
    const transactionResult = await addTransaction(userId, -currentBalance, report);
    
    console.log("Balance reset successfully and transaction created");
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
    return { success: false, transaction: null };
  }
};

// Update session count
export const updateSessionCount = async (userId: string, newCount: number) => {
  try {
    console.log("Updating session count to", newCount, "for user", userId);
    
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
      return false;
    }
    
    console.log("Session count updated successfully");
    return true;
  } catch (error) {
    console.error("Error in updateSessionCount:", error);
    return false;
  }
};
