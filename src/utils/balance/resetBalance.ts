
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { addTransaction } from '../transactionUtils';
import { balanceManager } from "./balanceManager";

// Reset user balance with retry mechanism
export const resetUserBalance = async (userId: string, currentBalance: number) => {
  const maxRetries = 3;
  let retryCount = 0;
  
  // Obtenir le solde le plus fiable depuis notre gestionnaire centralisé
  const managerBalance = balanceManager.getCurrentBalance();
  const highestBalance = balanceManager.getHighestBalance();
  
  // Toujours utiliser la valeur maximum
  currentBalance = Math.max(currentBalance, managerBalance, highestBalance);
  
  console.log(`[resetBalance] Using current balance: ${currentBalance} for withdrawal`);
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Resetting balance from ${currentBalance} to 0 for user ${userId} (attempt ${retryCount + 1}/${maxRetries})`);
      
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
        retryCount++;
        
        if (retryCount >= maxRetries) {
          toast({
            title: "Erreur",
            description: "Impossible de traiter votre retrait. Veuillez réessayer.",
            variant: "destructive"
          });
          return { success: false, transaction: null };
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
        continue;
      }
      
      const report = `Retrait de ${currentBalance.toFixed(2)}€ effectué avec succès. Le transfert vers votre compte bancaire est en cours.`;
      
      // Add withdrawal transaction result
      const transactionResult = await addTransaction(userId, -currentBalance, report);
      
      // Informer le gestionnaire de solde de la réinitialisation (retrait complet)
      balanceManager.updateBalance(0, true);
      
      // Informer tous les composants de réinitialiser leur état de solde
      window.dispatchEvent(new CustomEvent('balance:reset', {
        detail: { userId }
      }));
      
      console.log("Balance reset successfully and transaction created");
      return { 
        success: true, 
        transaction: transactionResult.success ? transactionResult.transaction : null 
      };
    } catch (error) {
      console.error("Error in resetBalance (attempt " + (retryCount + 1) + "):", error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue. Veuillez réessayer.",
          variant: "destructive"
        });
        return { success: false, transaction: null };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
    }
  }
  
  return { success: false, transaction: null };
};
