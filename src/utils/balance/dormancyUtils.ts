
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Constants for dormancy penalties
export const DORMANCY_CONSTANTS = {
  MONTHLY_FEE: 15, // €15 monthly dormancy fee
  STAGES: [
    { days: 30, penalty: 0.25 }, // 25% penalty after 30 days
    { days: 60, penalty: 0.50 }, // 50% penalty after 60 days
    { days: 90, penalty: 1.00 }, // 100% penalty after 90 days
  ],
  REACTIVATION_MONTHS: 3, // Reactivation fee equals 3 months of payments
};

// Check account dormancy status
export const checkAccountDormancy = async (userId: string) => {
  try {
    // Get user balance and subscription information
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('balance, subscription, updated_at')
      .eq('id', userId)
      .single();
      
    if (balanceError || !balanceData) {
      console.error("Error fetching user balance for dormancy check:", balanceError);
      return { isDormant: false };
    }
    
    // Check if account should be dormant based on payment status
    // For demo purposes, we'll assume an account becomes dormant if not updated in 10 days
    const lastUpdatedDate = new Date(balanceData.updated_at);
    const currentDate = new Date();
    const daysSinceUpdate = Math.floor((currentDate.getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // For premium plans, check if dormant
    if (balanceData.subscription !== 'freemium' && daysSinceUpdate > 10) {
      // Account is in dormant state
      return {
        isDormant: true,
        dormancyDays: daysSinceUpdate,
        originalBalance: balanceData.balance,
        subscription: balanceData.subscription,
      };
    }
    
    return { isDormant: false };
  } catch (error) {
    console.error("Error in checkAccountDormancy:", error);
    return { isDormant: false };
  }
};

// Calculate penalties based on dormancy duration
export const calculateDormancyPenalties = (originalBalance: number, dormancyDays: number) => {
  let currentBalance = originalBalance;
  let penalties = [];

  // Apply monthly fee (assume 30 days in a month for simplicity)
  const monthsPassed = Math.floor(dormancyDays / 30);
  const monthlyFee = Math.min(currentBalance, DORMANCY_CONSTANTS.MONTHLY_FEE * monthsPassed);
  
  if (monthlyFee > 0) {
    currentBalance -= monthlyFee;
    penalties.push({
      type: 'fee',
      amount: monthlyFee,
      description: `Frais de dormance (${monthsPassed} mois)`
    });
  }

  // Apply progressive penalties
  for (const stage of DORMANCY_CONSTANTS.STAGES) {
    if (dormancyDays >= stage.days) {
      const penaltyAmount = currentBalance * stage.penalty;
      currentBalance -= penaltyAmount;
      
      penalties.push({
        type: 'penalty',
        amount: penaltyAmount,
        description: `Déchéance après ${stage.days} jours (${stage.penalty * 100}%)`
      });
    }
  }

  return {
    remainingBalance: Math.max(0, currentBalance),
    penalties,
    totalPenalties: originalBalance - Math.max(0, currentBalance)
  };
};

// Calculate reactivation fee
export const calculateReactivationFee = (subscription: string) => {
  // Simplified version - in a real app, you would look up the actual subscription cost
  const monthlyFees = {
    freemium: 0,
    pro: 19.99,
    visionnaire: 49.99,
    alpha: 99.99
  };
  
  const monthlyFee = monthlyFees[subscription as keyof typeof monthlyFees] || 0;
  return monthlyFee * DORMANCY_CONSTANTS.REACTIVATION_MONTHS;
};

// Apply dormancy penalties to account
export const applyDormancyPenalties = async (
  userId: string, 
  originalBalance: number, 
  remainingBalance: number, 
  penalties: Array<{type: string, amount: number, description: string}>
) => {
  try {
    // Update user balance
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ 
        balance: remainingBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error updating balance for dormancy penalties:", updateError);
      return { success: false };
    }
    
    // Add transaction entries for each penalty
    for (const penalty of penalties) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
          gain: -penalty.amount,
          report: `${penalty.description}: -${penalty.amount.toFixed(2)}€`
        }]);
        
      if (transactionError) {
        console.error("Error creating transaction for dormancy penalty:", transactionError);
      }
    }
    
    return { 
      success: true,
      newBalance: remainingBalance,
      totalPenaltyAmount: originalBalance - remainingBalance
    };
  } catch (error) {
    console.error("Error in applyDormancyPenalties:", error);
    return { success: false };
  }
};

// Reactivate dormant account
export const reactivateAccount = async (userId: string, subscription: string) => {
  try {
    const reactivationFee = calculateReactivationFee(subscription);
    
    // Update user subscription status
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error reactivating account:", updateError);
      return { 
        success: false,
        message: "Impossible de réactiver votre compte. Veuillez contacter le support." 
      };
    }
    
    // Add transaction for reactivation fee
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        gain: -reactivationFee,
        report: `Frais de réactivation: -${reactivationFee.toFixed(2)}€`
      }]);
      
    if (transactionError) {
      console.error("Error creating transaction for reactivation fee:", transactionError);
    }
    
    return { 
      success: true,
      reactivationFee,
      message: `Votre compte a été réactivé avec succès. Des frais de réactivation de ${reactivationFee.toFixed(2)}€ ont été appliqués.`
    };
  } catch (error) {
    console.error("Error in reactivateAccount:", error);
    return { 
      success: false,
      message: "Une erreur est survenue lors de la réactivation de votre compte."
    };
  }
};
