
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { addTransaction } from '../transactionUtils';

// Reset user balance with retry mechanism
export const resetUserBalance = async (userId: string, currentBalance: number) => {
  const maxRetries = 3;
  let retryCount = 0;
  
  // Vérifier s'il y a une valeur plus élevée dans localStorage
  try {
    const storedHighestBalance = localStorage.getItem('highestBalance');
    const storedCurrentBalance = localStorage.getItem('currentBalance');
    const storedLastKnownBalance = localStorage.getItem('lastKnownBalance');
    
    // Utiliser la valeur maximum parmi toutes les sources
    if (storedHighestBalance) {
      const parsedHighest = parseFloat(storedHighestBalance);
      if (!isNaN(parsedHighest) && parsedHighest > currentBalance) {
        console.log(`[resetBalance] Using higher stored balance: ${parsedHighest} > ${currentBalance}`);
        currentBalance = parsedHighest;
      }
    }
    
    if (storedCurrentBalance) {
      const parsedCurrent = parseFloat(storedCurrentBalance);
      if (!isNaN(parsedCurrent) && parsedCurrent > currentBalance) {
        console.log(`[resetBalance] Using higher current balance: ${parsedCurrent} > ${currentBalance}`);
        currentBalance = parsedCurrent;
      }
    }
    
    if (storedLastKnownBalance) {
      const parsedLastKnown = parseFloat(storedLastKnownBalance);
      if (!isNaN(parsedLastKnown) && parsedLastKnown > currentBalance) {
        console.log(`[resetBalance] Using higher last known balance: ${parsedLastKnown} > ${currentBalance}`);
        currentBalance = parsedLastKnown;
      }
    }
  } catch (e) {
    console.error("Failed to read persisted balance for withdrawal:", e);
  }
  
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
      
      // Nettoyer le localStorage après réinitialisation du solde réussie
      try {
        localStorage.removeItem('highestBalance');
        localStorage.removeItem('currentBalance');
        localStorage.removeItem('lastBalanceUpdateTime');
        localStorage.removeItem('lastKnownBalance');
        console.log("LocalStorage balance data cleared after withdrawal");
        
        // Informer tous les composants de réinitialiser leur état de solde
        window.dispatchEvent(new CustomEvent('balance:reset', {
          detail: { userId }
        }));
      } catch (e) {
        console.error("Failed to clear localStorage after withdrawal:", e);
      }
      
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
