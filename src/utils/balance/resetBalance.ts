
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { balanceManager } from "./balanceManager";

/**
 * Réinitialise le solde et les compteurs de l'utilisateur
 * @param userId ID de l'utilisateur
 */
export const resetBalance = async (userId: string | null) => {
  if (!userId) {
    console.warn("resetBalance called without userId");
    return;
  }
  
  try {
    console.log(`[Balance] Resetting balance for user: ${userId}`);
    
    // Chercher le solde maximum en base de données
    const highestBalance = balanceManager.getHighestBalance();
    
    // Mettre à jour le solde en base de données
    const { data, error } = await supabase
      .from('user_balances')
      .update({
        balance: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id');
      
    if (error) {
      console.error("[Balance] Error resetting balance in DB:", error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser votre solde. Veuillez réessayer.",
        variant: "destructive"
      });
      return;
    }
    
    // Réinitialiser les données locales via le gestionnaire central
    balanceManager.resetUserData(userId);
    
    // Réinitialiser également le localStorage
    try {
      localStorage.removeItem(`todaysGains_${userId}`);
      localStorage.removeItem(`lastSessionTimestamp_${userId}`);
      localStorage.removeItem(`dailySessionCount_${userId}`);
      localStorage.removeItem(`currentBalance_${userId}`);
      
      // Réinitialiser la clé générique pour la date du jour
      const today = new Date().toISOString().split('T')[0];
      localStorage.removeItem(`todaysGains_${today}_${userId}`);
      
    } catch (error) {
      console.error("[Balance] Error clearing localStorage:", error);
    }
    
    // Notifier le système pour qu'il se mette à jour
    window.dispatchEvent(new CustomEvent('balance:reset', {
      detail: { userId }
    }));
    
    console.log(`[Balance] Reset completed for user: ${userId}`);
    
    return { success: true };
  } catch (error) {
    console.error("[Balance] Error in resetBalance:", error);
    toast({
      title: "Erreur",
      description: "Une erreur s'est produite lors de la réinitialisation. Veuillez réessayer.",
      variant: "destructive"
    });
    return { success: false };
  }
};
