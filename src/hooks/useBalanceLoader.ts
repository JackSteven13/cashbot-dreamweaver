
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceLoader = (setIsNewUser: (isNew: boolean) => void) => {
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const loadUserBalance = useCallback(async (userId: string) => {
    if (isBalanceLoading) return null;
    
    try {
      setIsBalanceLoading(true);
      console.log("Loading balance for user:", userId);
      
      // Fetch balance from user_balances table
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance, daily_session_count')
        .eq('id', userId)
        .single();
      
      if (balanceError) {
        console.error("Error loading balance:", balanceError);
        
        if (balanceError.code === 'PGRST116') {
          // No balance record found - definitely a new user
          console.log("No balance record found, user is new");
          setIsNewUser(true);
          setIsBalanceLoaded(true);
          
          // Forcer le solde à 0 pour un nouvel utilisateur
          balanceManager.forceBalanceSync(0, userId);
          
          // Nettoyer toutes les données préexistantes
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (
                key.startsWith('currentBalance') ||
                key.startsWith('lastKnownBalance') ||
                key.startsWith('lastUpdatedBalance') ||
                key.startsWith('highest_balance') ||
                key.startsWith('user_stats_')
              )) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            console.error("Erreur lors du nettoyage des données locales:", e);
          }
          
          return {
            balance: 0,
            loaded: true
          };
        }
        
        return null;
      }
      
      // If balance exists, check if it's a new user (zero balance and no sessions)
      if (balanceData) {
        // S'assurer que serverBalance est un nombre valide
        const serverBalance = balanceData.balance !== null && !isNaN(balanceData.balance) 
          ? parseFloat(balanceData.balance.toFixed(2)) 
          : 0;
        
        const isUserNew = serverBalance === 0 && balanceData.daily_session_count === 0;
        
        if (isUserNew) {
          console.log("User appears to be new (zero balance)");
          setIsNewUser(true);
          
          // Pour les nouveaux utilisateurs, forcer à 0 et nettoyer toutes les données
          balanceManager.forceBalanceSync(0, userId);
          
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (
                key.startsWith('currentBalance') ||
                key.startsWith('lastKnownBalance') ||
                key.startsWith('lastUpdatedBalance') ||
                key.startsWith('highest_balance') ||
                key.startsWith('user_stats_')
              )) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            console.error("Erreur lors du nettoyage des données locales:", e);
          }
          
        } else {
          setIsNewUser(false);
          // Utilisateur existant, utiliser son solde du serveur
          balanceManager.forceBalanceSync(serverBalance, userId);
        }
        
        console.log(`Solde chargé pour ${userId}: ${serverBalance}€ (nouveau: ${isUserNew})`);
        setIsBalanceLoaded(true);
        
        return {
          balance: isUserNew ? 0 : serverBalance,
          loaded: true
        };
      } else {
        console.log("No balance data found, user might be new");
        setIsNewUser(true);
        return {
          balance: 0,
          loaded: false
        };
      }
    } catch (error) {
      console.error("Error in loadUserBalance:", error);
      return {
        balance: 0,
        loaded: false
      };
    } finally {
      setIsBalanceLoading(false);
    }
  }, [isBalanceLoading, setIsNewUser]);

  return { loadUserBalance, isBalanceLoaded, isBalanceLoading };
};

export default useBalanceLoader;
