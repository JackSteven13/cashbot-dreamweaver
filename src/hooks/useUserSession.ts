
import { toast } from "@/components/ui/use-toast";
import { 
  updateSessionCount,
  updateUserBalance,
  addTransaction
} from "@/utils/userDataUtils";
import { supabase } from "@/integrations/supabase/client";

export const useUserSession = () => {
  // Increment session count
  const incrementSessionCount = async (dailySessionCount: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    
    const userId = session.user.id;
    const newCount = dailySessionCount + 1;
    
    const success = await updateSessionCount(userId, newCount);
    return success ? newCount : dailySessionCount;
  };

  // Update balance after a session
  const updateBalance = async (gain: number, report: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false };
    
    // Get current user data
    const { data: userBalanceData } = await supabase
      .from('user_balances')
      .select('balance, subscription')
      .eq('id', session.user.id)
      .single();
      
    if (!userBalanceData) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos données. Veuillez réessayer.",
        variant: "destructive"
      });
      return { success: false };
    }
    
    // Ensure gain is always positive
    const positiveGain = Math.max(0, gain);
    
    // Update balance
    const balanceResult = await updateUserBalance(
      session.user.id,
      userBalanceData.balance,
      positiveGain,
      userBalanceData.subscription
    );
    
    if (!balanceResult.success) {
      return { success: false };
    }
    
    // Add transaction
    const transactionResult = await addTransaction(
      session.user.id,
      positiveGain,
      report
    );
    
    return { 
      success: true, 
      newBalance: balanceResult.newBalance, 
      limitReached: balanceResult.limitReached,
      transaction: transactionResult.success ? transactionResult.transaction : null
    };
  };

  // Reset balance (for withdrawals)
  const resetBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false };
    
    // Get current balance
    const { data: userBalanceData } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('id', session.user.id)
      .single();
      
    if (!userBalanceData) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos données. Veuillez réessayer.",
        variant: "destructive"
      });
      return { success: false };
    }
    
    // Reset balance
    const result = await resetUserBalance(session.user.id, userBalanceData.balance);
    
    return result;
  };

  return {
    incrementSessionCount,
    updateBalance,
    resetBalance
  };
};
