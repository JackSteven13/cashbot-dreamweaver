
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { fetchUserBalance } from '@/utils/user/balanceUtils';
import { toast } from "@/components/ui/use-toast";

export const useBalanceLoader = (onNewUser: (value: boolean) => void) => {
  const loadUserBalance = useCallback(async (userId: string) => {
    // Get balance data
    let balanceData = null;
    let isUserNew = false;
    const balanceResult = await fetchUserBalance(userId);
    
    // Process balance data
    if (balanceResult) {
      balanceData = balanceResult.data;
      isUserNew = balanceResult.isNewUser;
      
      // Pour les nouveaux utilisateurs, on s'assure que le solde et le nombre de sessions sont à 0
      if (isUserNew && balanceData) {
        balanceData.balance = 0;
        balanceData.daily_session_count = 0;
      }
    } else {
      // Create new balance if needed
      try {
        const { data: newBalance, error: balanceError } = await supabase
          .rpc('create_user_balance', {
            user_id: userId
          });
          
        if (balanceError) {
          throw balanceError;
        }
        
        if (newBalance) {
          balanceData = Array.isArray(newBalance) ? newBalance[0] : newBalance;
          // S'assurer que le solde est à 0 pour les nouveaux utilisateurs
          if (balanceData) {
            balanceData.balance = 0;
            balanceData.daily_session_count = 0;
          }
          isUserNew = true;
        } else {
          throw new Error("Failed to create balance");
        }
      } catch (error) {
        console.error("Failed to create balance:", error);
        return null;
      }
    }
    
    // Show welcome message for new users
    if (isUserNew) {
      onNewUser(true);
      toast({
        title: "Bienvenue sur Stream Genius !",
        description: "Votre compte a été créé avec succès. Notre système est maintenant actif pour vous.",
      });
    }

    return {
      balanceData,
      isUserNew
    };
  }, [onNewUser]);

  return {
    loadUserBalance
  };
};
