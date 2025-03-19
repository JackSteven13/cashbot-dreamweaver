
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { 
  updateSessionCount,
  updateUserBalance,
  resetUserBalance
} from "@/utils/userBalanceUtils";
import { addTransaction } from "@/utils/transactionUtils";
import { supabase } from "@/integrations/supabase/client";

// Define return types for better type safety
interface BalanceUpdateResult {
  success: boolean;
  newBalance?: number;
  limitReached?: boolean;
  transaction?: {
    date: string;
    gain: number;
    report: string;
  } | null;
}

export const useUserSession = () => {
  const [session, setSession] = useState(null);
  
  // Check for session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
        }
      );
      
      // Clean up subscription
      return () => {
        subscription.unsubscribe();
      };
    };
    
    checkSession();
  }, []);
  
  // Increment session count
  const incrementSessionCount = async (dailySessionCount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        return false;
      }
      
      const userId = session.user.id;
      const newCount = dailySessionCount + 1;
      
      console.log("Incrementing session count from", dailySessionCount, "to", newCount);
      const success = await updateSessionCount(userId, newCount);
      return success ? newCount : false;
    } catch (error) {
      console.error("Error incrementing session count:", error);
      return false;
    }
  };

  // Update balance after a session
  const updateBalance = async (gain: number, report: string): Promise<BalanceUpdateResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour effectuer cette action.",
          variant: "destructive"
        });
        return { success: false };
      }
      
      // Get current user data
      const { data: userBalanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance, subscription')
        .eq('id', session.user.id)
        .single();
        
      if (balanceError || !userBalanceData) {
        console.error("Failed to fetch user balance:", balanceError);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer vos données. Veuillez réessayer.",
          variant: "destructive"
        });
        return { success: false };
      }
      
      // Ensure gain is always positive and format to 2 decimal places
      const positiveGain = Math.max(0, parseFloat(gain.toFixed(2)));
      
      // Update balance
      const balanceResult = await updateUserBalance(
        session.user.id,
        userBalanceData.balance,
        positiveGain,
        userBalanceData.subscription
      );
      
      if (!balanceResult.success) {
        console.error("Failed to update balance");
        return { success: false };
      }
      
      console.log("Balance updated successfully:", balanceResult);
      
      // Add transaction
      const transactionResult = await addTransaction(
        session.user.id,
        positiveGain,
        report
      );
      
      // Update local storage with current subscription
      localStorage.setItem('subscription', userBalanceData.subscription);
      
      return { 
        success: true, 
        newBalance: balanceResult.newBalance, 
        limitReached: balanceResult.limitReached,
        transaction: transactionResult.success ? transactionResult.transaction : null
      };
    } catch (error) {
      console.error("Error updating balance:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
      return { success: false };
    }
  };

  // Reset balance (for withdrawals)
  const resetBalance = async (): Promise<BalanceUpdateResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        return { success: false };
      }
      
      // Get current balance
      const { data: userBalanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance, subscription')
        .eq('id', session.user.id)
        .single();
        
      if (balanceError || !userBalanceData) {
        console.error("Failed to fetch user balance for reset:", balanceError);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer vos données. Veuillez réessayer.",
          variant: "destructive"
        });
        return { success: false };
      }
      
      // Update local storage with current subscription
      localStorage.setItem('subscription', userBalanceData.subscription);
      
      // Reset balance
      const result = await resetUserBalance(session.user.id, userBalanceData.balance);
      
      // Make sure the transaction property is properly typed in the result
      return { 
        success: result.success,
        transaction: result.success && result.transaction ? result.transaction : null
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

  // Force refresh user data from server
  const refreshUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        return false;
      }
      
      // Get current user data
      const { data, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
        
      if (error || !data) {
        console.error("Failed to fetch user data:", error);
        return false;
      }
      
      // Update local storage with current subscription
      localStorage.setItem('subscription', data.subscription);
      
      return true;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return false;
    }
  };

  return {
    session,
    incrementSessionCount,
    updateBalance,
    resetBalance,
    refreshUserData
  };
};
