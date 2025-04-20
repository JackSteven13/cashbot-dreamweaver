
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { fetchUserBalance } from '@/utils/user/balanceUtils';
import { toast } from "@/components/ui/use-toast";
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceLoader = (onNewUser: (value: boolean) => void) => {
  const loadUserBalance = useCallback(async (userId: string) => {
    // Get balance data
    let balanceData = null;
    let isUserNew = false;
    const balanceResult = await fetchUserBalance(userId);
    
    // Process balance data
    if (balanceResult) {
      balanceData = balanceResult.data;
      
      // Vérification plus stricte d'un nouvel utilisateur :
      // On considère un utilisateur comme nouveau seulement si:
      // 1. L'API indique explicitement que c'est un nouvel utilisateur
      // 2. Le compte a été créé dans les 5 minutes (au lieu de 10)
      // 3. Il n'y a aucune transaction
      // 4. Il n'a jamais vu le message de bienvenue
      
      const isExplicitlyNew = balanceResult.isNewUser;
      
      // Vérification basée sur le timestamp de création (5 minutes au lieu de 10)
      const creationTime = balanceData?.created_at || null;
      const isRecentlyCreated = creationTime ? 
        (new Date().getTime() - new Date(creationTime).getTime()) < 5 * 60 * 1000 : // 5 minutes
        false;
      
      // Vérifier si l'utilisateur a des transactions
      const hasNoTransactions = !balanceData?.transactions || balanceData.transactions.length === 0;
      
      // Vérifier également si cet utilisateur a déjà vu le message de bienvenue
      const welcomeMessageShown = localStorage.getItem('welcomeMessageShown') === 'true';
      
      // Un utilisateur est considéré comme nouveau uniquement si toutes ces conditions sont remplies
      isUserNew = isExplicitlyNew && isRecentlyCreated && hasNoTransactions && !welcomeMessageShown;
      
      console.log("User status check:", {
        userId,
        isExplicitlyNew,
        creationTime,
        isRecentlyCreated,
        hasNoTransactions,
        welcomeShown: welcomeMessageShown,
        finalIsNewUser: isUserNew
      });
      
      // Protection critique: vérifier si le solde de la base est inférieur au solde maximum stocké
      const highestStoredBalance = balanceManager.getHighestBalance(); // Maintenant défini dans balanceManager
      
      // Pour les nouveaux utilisateurs, on initialise le solde et le nombre de sessions à 0
      if (isUserNew && balanceData) {
        console.log("Nouveau utilisateur détecté - Initialisation du solde à zéro");
        balanceData.balance = 0;
        balanceData.daily_session_count = 0;
        
        // Assurer la synchronisation avec la base de données pour les nouveaux utilisateurs
        try {
          const { error } = await supabase
            .from('user_balances')
            .update({ balance: 0, daily_session_count: 0 })
            .eq('id', userId);
            
          if (error) {
            console.error("Erreur lors de la réinitialisation du solde pour nouvel utilisateur:", error);
          }
        } catch (err) {
          console.error("Exception lors de la réinitialisation du solde:", err);
        }
      } 
      // Si nous avons un solde stocké plus élevé que celui de la base, mettre à jour la base
      else if (!isUserNew && highestStoredBalance > 0 && balanceData && balanceData.balance < highestStoredBalance) {
        console.log(`Solde DB (${balanceData.balance}) inférieur au solde maximum stocké (${highestStoredBalance}). Synchronisation...`);
        
        try {
          const { error } = await supabase
            .from('user_balances')
            .update({ 
              balance: highestStoredBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (error) {
            console.error("Erreur lors de la synchronisation du solde:", error);
          } else {
            console.log(`Solde mis à jour avec succès dans la base à ${highestStoredBalance}`);
            // Mettre à jour les données locales pour refléter le changement
            balanceData.balance = highestStoredBalance;
          }
        } catch (err) {
          console.error("Exception lors de la synchronisation du solde:", err);
        }
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
      
      // Effacer tout cache de solde dans localStorage pour les nouveaux utilisateurs
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('lastKnownBalance');
      localStorage.removeItem('highestBalance');
      localStorage.removeItem('balanceState');
    } else {
      // Important: explicitement mettre à jour le state pour les utilisateurs existants
      onNewUser(false);
      
      // Initialiser le gestionnaire de solde avec la valeur de la base de données
      if (balanceData) {
        balanceManager.forceBalanceSync(balanceData.balance);
      }
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
